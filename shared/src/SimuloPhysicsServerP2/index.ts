import * as p2 from "p2-es";
import SimuloObjectData from "../SimuloObjectData";

interface ShapeContentData {
    id: string;
    type: "cuboid" | "ball" | "polygon" | "line" | "plane";
    color: number;
    /** 0-1 alpha */
    alpha: number;
    border: number | null;
    borderWidth: number | null;
}

interface CollisionSound {
    sound: string;
    volume: number;
}

interface BaseShapeData {
    /** If none is provided, one will automatically be generated. If you provide this, it should always be in a container, there's no reason to supply one on root.
     * 
     * Good example of when to supply this: you are loading saved objects within a container.
     * 
     * Bad example of supplying this: you are creating a new object and giving it ID "ground". This is bad usage, IDs should always be like `/0`, `/34/1993`, etc. */
    id?: string;
    name: string | undefined;
    /** Path to a sound file for collisions. Relative to /assets/sounds/ */
    sound: string | null;
    /** Color number like 0xffffff */
    color: number;
    /** 0-1 alpha */
    alpha: number;
    /** Color number or null for no border */
    border: number | null;
    borderWidth: number | null;
    borderScaleWithZoom: boolean;
    image: string | null;
    /** We sort shapes with this for almost everything, including rendering. Newer shapes get a higher Z Depth. At the start of a scene, IDs and Z Depths will be the same, but user interaction can change this. */
    zDepth: number;
    flipImage?: boolean;
    position: { x: number, y: number },
    isStatic: boolean,
    friction: number,
    restitution: number,
    density: number,
}

interface Polygon extends ShapeContentData {
    type: "polygon";
    points: [x: number, y: number][];
}

interface Cuboid extends ShapeContentData {
    type: "cuboid";
    width: number;
    height: number;
    depth: number;
}

interface Ball extends ShapeContentData {
    type: "ball";
    radius: number;
    cakeSlice: boolean;
}

interface Plane extends ShapeContentData { // points up, infinite at bottom, position is on the surface of plane
    type: "plane";
}

/** Translation and rotation to apply to a shape. Scale is not included in this (and is instead in `ShapeContentData`) since it rarely changes, unlike position and rotation, which usually change every frame. */
interface ShapeTransformData {
    x: number;
    y: number;
    z: number;
    angle: number;
}

/** The spring data needed for rendering */

interface SimuloSpringInfo {
    pointA: { x: number, y: number };
    pointB: { x: number, y: number };
}

interface SimuloPhysicsStepInfo {
    delta: {
        /** Shape content that has changed since last step. */
        shapeContent: { [id: string]: ShapeContentData };

        /** New positioning and rotation of shape contents. */
        shapeTransforms: { [id: string]: ShapeTransformData };

        /** IDs of shape contents that are no more. */
        removedContents: string[];
    };

    ms: number;

    springs: SimuloSpringInfo[];

    sounds: CollisionSound[];
}

class SimuloPhysicsServerP2 {
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
    }) {
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
        }
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

    getObjectAtPoint(x: number, y: number): p2.Body | null {
        let bodies = this.world.hitTest([x, y], this.world.bodies, 5);

        let b: p2.Body | undefined = undefined;
        while (bodies.length > 0) {
            b = bodies.shift();
            if (!b || b.type === p2.Body.STATIC) {
                b = undefined;
            } else {
                break;
            }
        }

        return b || null;
    }

    getObjectsAtPoint(x: number, y: number): p2.Body[] {
        let bodies = this.world.hitTest([x, y], this.world.bodies, 5);
        return bodies;
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
            mass: rectangle.isStatic ? 0 : 1
        });
        let shape = new p2.Box({
            width: rectangle.width,
            height: rectangle.height
        });
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
        bodyA: p2.Body;
        bodyB: p2.Body;
        stiffness: number;
        damping: number;
        restLength: number;
        localAnchorA: [number, number];
        localAnchorB: [number, number];
    }) {
        let constraint = new p2.LinearSpring(spring.bodyA, spring.bodyB, {
            stiffness: spring.stiffness,
            damping: spring.damping,
            restLength: spring.restLength,
            localAnchorA: spring.localAnchorA,
            localAnchorB: spring.localAnchorB
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

    getObjectData(body: p2.Body): SimuloObjectData | null {
        return this.objectDatas[body.id] || null;
    }
}


export default SimuloPhysicsServerP2;
export {
    SimuloPhysicsStepInfo,
    ShapeContentData,
    Cuboid,
    Polygon,
    Ball,
    ShapeTransformData,
    Plane
};