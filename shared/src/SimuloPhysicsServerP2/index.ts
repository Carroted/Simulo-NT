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
import SavedWorldState from "../SavedWorldState";
import SimuloSpring from "../SimuloSpring";

class SimuloPhysicsServerP2 implements SimuloPhysicsServer {
    type: "2d" | "3d" = "2d";
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

    destroyObject(object: SimuloObject): void {
        if (object.reference instanceof p2.Body) {
            this.destroyBody(object.reference);
        }
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
            description: null,
            borderAlpha: 1,
            borderScaleWithZoom: false,
            image: null,
            imageTransformations: null,
            text: null,
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

    getObjectsInCuboid(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): SimuloObject[] {
        let intersection = this.world.broadphase.aabbQuery(this.world, new p2.AABB({
            lowerBound: [Math.min(startPoint.x, endPoint.x), Math.min(startPoint.y, endPoint.y)],
            upperBound: [Math.max(startPoint.x, endPoint.x), Math.max(startPoint.y, endPoint.y)]
        }));

        let bodies = intersection.filter((body) => {
            // if its shape is a plane, ignore
            return !(body.shapes[0] instanceof p2.Plane);
        });

        return bodies.map((body) => {
            return this.getSimuloObject(body)!;
        });
    }

    addBall(circle: BaseShapeData & {
        radius: number;
        cakeSlice: boolean;
    }): SimuloObject {
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
            circleCake: circle.cakeSlice
        };
        this.changedContents[body.shapes[0].id.toString()] = this.getShapeContent(body)!;
        return this.getSimuloObject(body)!;
    }

    addCuboid(rectangle: BaseShapeData & {
        width: number;
        height: number;
        depth: number;
    }): SimuloObject {
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

        return this.getSimuloObject(body)!;
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
        let groundBody = new p2.Body();
        this.world.addBody(groundBody);
        let constraint = new p2.LinearSpring(spring.objectA?.reference, spring.objectB?.reference ?? groundBody, {
            stiffness: spring.stiffness,
            damping: spring.damping,
            restLength: spring.restLength,
            localAnchorA: [spring.localAnchorA.x, spring.localAnchorA.y],
            localAnchorB: [spring.localAnchorB.x, spring.localAnchorB.y]
        });
        this.world.addSpring(constraint);
        return {
            destroy: () => {
                this.world.removeSpring(constraint);
            },
            reference: constraint,
            setLocalAnchorA: (anchor: { x: number, y: number, z: number }) => {
                constraint.localAnchorA = [anchor.x, anchor.y];
            },
            setLocalAnchorB: (anchor: { x: number, y: number, z: number }) => {
                constraint.localAnchorB = [anchor.x, anchor.y];
            },
        };
    }

    removeSpring(spring: SimuloSpring) {
        this.world.removeSpring(spring.reference);
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

    getObjectByID(id: string): SimuloObject | null {
        let body = this.world.getBodyByID(parseInt(id));
        if (!body) return null;
        return this.getSimuloObject(body);
    }

    saveScene(): SavedWorldState {
        // nothing lmao
        return {} as any;
    }

    destroy(): void {
        // we have to shut down the physics engine
        this.world.clear();
        // @ts-ignore
        this.world = null;
    }

    getLocalObjectPoint(object: SimuloObject, worldPoint: { x: number; y: number; z: number; }): { x: number; y: number; z: number; } {
        let out = p2.vec2.create();
        (object.reference as p2.Body).toLocalFrame(out, [worldPoint.x, worldPoint.y]);
        return {
            x: out[0],
            y: out[1],
            z: 0
        };
    }

    getWorldObjectPoint(object: SimuloObject, localPoint: { x: number; y: number; z: number; }): { x: number; y: number; z: number; } {
        let out = p2.vec2.create();
        (object.reference as p2.Body).toWorldFrame(out, [localPoint.x, localPoint.y]);
        return {
            x: out[0],
            y: out[1],
            z: 0
        };
    }

    addAxle(axle: { bodyA: SimuloObject; bodyB: SimuloObject; localAnchorA: { x: number; y: number; z: number; }; localAnchorB: { x: number; y: number; z: number; }; }) {
        let constraint = new p2.RevoluteConstraint(axle.bodyA.reference as p2.Body, axle.bodyB.reference as p2.Body, {
            localPivotA: [axle.localAnchorA.x, axle.localAnchorA.y],
            localPivotB: [axle.localAnchorB.x, axle.localAnchorB.y],
            collideConnected: false
        });
        this.world.addConstraint(constraint);
        return {
            destroy: () => {
                this.world.removeConstraint(constraint);
            },
            reference: constraint,
            setLocalAnchorA: (anchor: { x: number, y: number, z: number }) => {
                constraint.pivotA = [anchor.x, anchor.y];
            },
            setLocalAnchorB: (anchor: { x: number, y: number, z: number }) => {
                constraint.pivotB = [anchor.x, anchor.y];
            },
        };

    }
}


export default SimuloPhysicsServerP2;