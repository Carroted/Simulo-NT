import * as p2 from "p2-es";
import SimuloObjectData from "../SimuloObjectData";
import ShapeTransformData from "../ShapeTransformData";
import ShapeContentData from "../ShapeContentData";
import CollisionSound from "../CollisionSound";
import SimuloPhysicsStepInfo from "../SimuloPhysicsStepInfo";

import BaseShapeData from "../BaseShapeData";

import { Polygon, Plane, Ball, Cuboid } from "../ShapeContentData";

import SimuloSpringInfo from "../SimuloSpringInfo";
import SimuloPhysicsServer from "../SimuloPhysicsServer";
import SimuloObject from "../SimuloObject";

class SimuloPhysicsServerP2 implements SimuloPhysicsServer {
    world: p2.World;
    changedContents: {
        [id: string]: ShapeContentData;
    } = {};
    removedContents: string[] = [];

    objectDatas: {
        [id: number]: SimuloObjectData
    } = {};

    constructor() {
        this.world = new p2.World({
            gravity: [0, -9.81]
        });
        let plane = new p2.Body({
            mass: 0
        });
        let planeShape = new p2.Plane();
        plane.addShape(planeShape);
        this.world.addBody(plane);
        this.objectDatas[plane.id] = {
            id: plane.id.toString(),
            name: "Simulo Planet",
            sound: null,
            color: 0xa1acfa,
            alpha: 1,
            border: null,
            borderWidth: null,
            image: null,
            zDepth: 1,
            borderScaleWithZoom: false,
        };
        this.changedContents[planeShape.id] = this.getShapeContent(plane)!;

        // Create Ground.
        let groundSize = 40.0;
        let grounds = [
            { x: 0.0, y: 0.0, hx: groundSize, hy: 0.1 },
            { x: -groundSize, y: groundSize, hx: 0.1, hy: groundSize },
            { x: groundSize, y: groundSize, hx: 0.1, hy: groundSize },
        ];

        grounds.forEach((ground) => {
            /*let bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
                ground.x,
                ground.y,
            );
            let body = world.createRigidBody(bodyDesc);
            let colliderDesc = RAPIER.ColliderDesc.cuboid(ground.hx, ground.hy);
            world.createCollider(colliderDesc, body);*/
            this.addRectangle({
                width: ground.hx * 2, height: ground.hy * 2,
                color: 0xa1acfa,
                alpha: 1,
                border: null,
                name: 'joe',
                sound: '/assets/sounds/impact.wav',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
                position: { x: ground.x, y: ground.y },
                isStatic: true,
                friction: 0.5,
                restitution: 0,
                density: 0,
            });
        });

        // Dynamic cubes.
        let num = 20;
        let numy = 50;
        let rad = 1.0;

        let shift = rad * 2.0 + rad;
        let centerx = shift * (num / 2);
        let centery = shift / 2.0;

        let i, j;

        for (j = 0; j < numy; ++j) {
            for (i = 0; i < num; ++i) {
                let x = i * shift - centerx;
                let y = j * shift + centery + 3.0;

                /*
                // Create dynamic cube.
                let bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
                let body = world.createRigidBody(bodyDesc);
                let colliderDesc = RAPIER.ColliderDesc.cuboid(rad, rad);
                world.createCollider(colliderDesc, body);*/
                this.addRectangle({
                    width: rad * 2, height: rad * 2,
                    color: 0xa1acfa,
                    alpha: 1,
                    border: null,
                    name: 'joe',
                    sound: '/assets/sounds/impact.wav',
                    borderWidth: 1,
                    borderScaleWithZoom: true,
                    image: null,
                    zDepth: 0,
                    position: { x: x, y: y },
                    isStatic: false,
                    friction: 0.5,
                    restitution: 0,
                    density: 1,
                });
            }
        }
    }

    step(): SimuloPhysicsStepInfo {
        let before = performance.now();

        // fixed timestep = deterministic physics = good
        // dynamic timestep = inconsistent physics = bad
        this.world.step(1 / 60);

        return this.getStepInfo([], before);
    }

    getStepInfo(sounds: CollisionSound[], before: number): SimuloPhysicsStepInfo {
        let changed = this.changedContents;
        let removed = this.removedContents;
        this.changedContents = {};
        this.removedContents = [];

        return {
            delta: {
                shapeContent: changed,
                shapeTransforms: this.getShapeTransforms(), // TODO: replace with delta
                removedContents: removed
            },
            ms: performance.now() - before,
            sounds: [],
            springs: this.world.springs.map((spring) => {
                if (spring instanceof p2.LinearSpring) {
                    let outA = p2.vec2.create();
                    let outB = p2.vec2.create();
                    spring.getWorldAnchorA(outA);
                    spring.getWorldAnchorB(outB);
                    return {
                        pointA: {
                            x: outA[0],
                            y: outA[1]
                        },
                        pointB: {
                            x: outB[0],
                            y: outB[1]
                        }
                    };
                }
                return null;
            }).filter((spring) => {
                return spring !== null;
            }) as SimuloSpringInfo[]
        };
    }

    getShapeTransforms(): { [id: string]: ShapeTransformData } {
        let transforms: { [id: string]: ShapeTransformData } = {};
        this.world.bodies.forEach((body) => {
            body.shapes.forEach((shape) => {
                let id = shape.id;
                let transform = {
                    x: body.position[0],
                    y: body.position[1],
                    z: 0,
                    angle: body.angle
                };
                transforms[id] = transform;
            });
        });
        return transforms;
    }

    destroyBody(body: p2.Body) {
        this.world.removeBody(body);
        this.removedContents.push(body.shapes[0].id.toString());
    }

    addPolygon(polygon: BaseShapeData & {
        points: { x: number, y: number }[];
    }): SimuloObject {
        let body = new p2.Body({
            mass: 1
        });
        if (body.fromPolygon(polygon.points.map((point) => {
            return [point.x, point.y];
        }), {
            removeCollinearPoints: 0.1
        })) {
            body.position = [polygon.position.x, polygon.position.y];
            body.angle = 0;
            this.world.addBody(body);
            this.objectDatas[body.id] = {
                id: body.id.toString(),
                name: polygon.name,
                sound: null,
                color: polygon.color,
                alpha: polygon.alpha,
                border: polygon.border,
                borderWidth: polygon.borderWidth,
                image: null,
                zDepth: 1,
                borderScaleWithZoom: false,
            };
            this.changedContents[body.shapes[0].id.toString()] = this.getShapeContent(body)!;
            return this.getSimuloObject(body)!;
        }
        throw new Error("Failed to create polygon");
    }

    getSimuloObject(reference: any): SimuloObject | null {
        if (reference instanceof p2.Body) {
            return {
                destroy: () => {
                    this.destroyBody(reference);
                },
                id: reference.id.toString(),
                reference: reference
            };
        }
        return null;
    }

    getShapeContent(body: p2.Body): ShapeContentData | null {
        let shape = body.shapes[0];
        shape.type
        if (!shape) return null;
        let id = shape.id;
        let objectData = this.objectDatas[body.id];
        let baseShape: ShapeContentData = {
            id: id.toString(),
            type: "cuboid",
            color: objectData ? objectData.color : 0xffffff,
            alpha: 1,
            border: null,
            borderWidth: null,
            name: objectData ? (objectData.name ?? "Some kind of object") : "Some kind of object",
            description: null
        };
        if (shape instanceof p2.Box) {
            let rect: Cuboid = {
                ...baseShape,
                type: "cuboid",
                width: shape.width,
                height: shape.height,
                depth: 1
            };
            return rect;
        } else if (shape instanceof p2.Circle) {
            let circle: Ball = {
                ...baseShape,
                type: "ball",
                radius: shape.radius,
                cakeSlice: true
            };
            return circle;
        } else if (shape instanceof p2.Convex) {
            let polygon: Polygon = {
                ...baseShape,
                type: "polygon",
                points: shape.vertices.map((vertex) => {
                    return [vertex[0], vertex[1]];
                })
            };
            return polygon;
        } else if (shape instanceof p2.Line) {
            // nothing lmao
            return null;
        } else if (shape instanceof p2.Plane) {
            let plane: Plane = {
                ...baseShape,
                type: "plane"
            };
            return plane;
        }
        else {
            return null;
        }
    }

    getObjectAtPoint(point: { x: number, y: number, z: number }): SimuloObject | null {
        let bodies = this.world.hitTest([point.x, point.y], this.world.bodies, 5);

        let b: p2.Body | undefined = undefined;
        while (bodies.length > 0) {
            b = bodies.shift();
            if (!b || b.type === p2.Body.STATIC) {
                b = undefined;
            } else {
                break;
            }
        }

        return this.getSimuloObject(b) || null;
    }

    getObjectsAtPoint(point: { x: number, y: number, z: number }): SimuloObject[] {
        let bodies = this.world.hitTest([point.x, point.y], this.world.bodies, 5);
        return bodies.map((body) => {
            return this.getSimuloObject(body)!;
        });
    }

    getObjectsInRect(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): p2.Body[] {
        let intersection = this.world.broadphase.aabbQuery(this.world, new p2.AABB({
            lowerBound: [Math.min(startPoint.x, endPoint.x), Math.min(startPoint.y, endPoint.y)],
            upperBound: [Math.max(startPoint.x, endPoint.x), Math.max(startPoint.y, endPoint.y)]
        }));

        let bodies = intersection.filter((body) => {
            // if its shape is a plane, ignore
            return !(body.shapes[0] instanceof p2.Plane);
        });

        return bodies;
    }

    addCircle(circle: BaseShapeData & {
        radius: number;
    }) {
        let body = new p2.Body({
            mass: 1
        });
        let shape = new p2.Circle({
            radius: circle.radius
        });
        body.addShape(shape);
        body.position = [circle.position.x, circle.position.y];
        body.angle = 0;
        this.world.addBody(body);
        this.objectDatas[body.id] = {
            id: body.id.toString(),
            name: circle.name,
            sound: null,
            color: circle.color,
            alpha: circle.alpha,
            border: circle.border,
            borderWidth: circle.borderWidth,
            image: null,
            zDepth: 1,
            borderScaleWithZoom: false,
        };
        this.changedContents[body.shapes[0].id.toString()] = this.getShapeContent(body)!;
    }

    addRectangle(rectangle: BaseShapeData & {
        width: number;
        height: number;
    }) {
        let body = new p2.Body({
            // we calculate mass based on density and width/height
            mass: rectangle.isStatic ? 0 : ((rectangle.density / 10) * rectangle.width * rectangle.height)
        });
        let shape = new p2.Box({
            width: rectangle.width,
            height: rectangle.height,
        });
        body.updateSolveMassProperties();
        // I = mass * (width.x * width.x + width.y * width.y) / 12.0f;
        // invI = 1.0f / I;

        let inertia = body.mass * (rectangle.width * rectangle.width + rectangle.height * rectangle.height) * 50000;
        body.inertia = inertia;
        body.invInertia = 1 / inertia;
        body.addShape(shape);
        body.position = [rectangle.position.x, rectangle.position.y];
        body.angle = 0;
        this.world.addBody(body);
        this.objectDatas[body.id] = {
            id: body.id.toString(),
            name: rectangle.name,
            sound: null,
            color: rectangle.color,
            alpha: rectangle.alpha,
            border: rectangle.border,
            borderWidth: rectangle.borderWidth,
            image: null,
            zDepth: 1,
            borderScaleWithZoom: false,
        };
        this.changedContents[body.shapes[0].id.toString()] = this.getShapeContent(body)!;
    }

    addSpring(spring: {
        objectA: SimuloObject | null; // null means world
        objectB: SimuloObject | null; // null means world
        stiffness: number;
        damping: number;
        restLength: number;
        localAnchorA: { x: number, y: number, z: number };
        localAnchorB: { x: number, y: number, z: number };
    }) {
        let constraint = new p2.LinearSpring(spring.objectA?.reference, spring.objectB?.reference, {
            stiffness: spring.stiffness,
            damping: spring.damping,
            restLength: spring.restLength,
            localAnchorA: [spring.localAnchorA.x, spring.localAnchorA.y],
            localAnchorB: [spring.localAnchorB.x, spring.localAnchorB.y]
        });
        this.world.addSpring(constraint);
        return constraint;
    }

    removeSpring(spring: p2.LinearSpring) {
        this.world.removeSpring(spring);
    }

    getLocalPoint(body: p2.Body, worldPoint: [number, number]): [number, number] {
        let vec: p2.Vec2 = p2.vec2.create();
        body.toLocalFrame(vec, worldPoint);
        return [vec[0], vec[1]];
    }

    getObjectData(body: p2.Body | SimuloObject): SimuloObjectData | null {
        if (!(body instanceof p2.Body)) {
            body = body.reference;
        }
        return this.objectDatas[(body as p2.Body).id] || null;
    }
}


export default SimuloPhysicsServerP2;