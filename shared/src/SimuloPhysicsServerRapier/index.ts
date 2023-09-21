import RAPIER from "@dimforge/rapier2d-compat";
import type Rapier from "@dimforge/rapier2d-compat";

import SimuloObjectData from "../SimuloObjectData";

interface ShapeContentData {
    id: string;
    type: "rectangle" | "circle" | "polygon" | "line";
    color: number;
    border: number | null;
}

interface Polygon extends ShapeContentData {
    type: "polygon";
    points: [x: number, y: number][];
}

interface Rectangle extends ShapeContentData {
    type: "rectangle";
    width: number;
    height: number;
}

interface Circle extends ShapeContentData {
    type: "circle";
    radius: number;
}

interface ShapeTransformData {
    x: number;
    y: number;
    angle: number;
}

interface SimuloPhysicsStepInfo {
    delta: {
        shapeContent: { [id: string]: ShapeContentData };
        shapeTransforms: { [id: string]: ShapeTransformData };
    };
    ms: number;
    springs: SimuloSpringInfo[];
}

/** Simulo creates fake spring joint with `addForceAtPoint` on two bodies */

interface SimuloSpring {
    bodyA: Rapier.RigidBody;
    bodyB: Rapier.RigidBody;
    localAnchorA: Rapier.Vector2;
    localAnchorB: Rapier.Vector2;
    stiffness: number;
    damping: number;
    targetLength: number; // aka rest length, i think target is a better name
}

interface SimuloSpringInfo {
    pointA: { x: number, y: number };
    pointB: { x: number, y: number };
}

class SimuloPhysicsServerRapier {
    world: Rapier.World | null = null;
    //graphics: Graphics;
    //mouse: { x: number; y: number };
    listeners: { [key: string]: Function[] } = {};
    colliders: Rapier.Collider[] = [];
    changedContents: { [id: string]: ShapeContentData } = {};

    private emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((listener) => {
                listener(data);
            });
        }
    }
    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    off(event: string, listener: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter((l) => l != listener);
        }
    }

    /** random hex number like 0xffffff */
    randomColor(hueMin: number, hueMax: number, saturationMin: number, saturationMax: number, valueMin: number, valueMax: number): number {
        let hue = hueMin + Math.random() * (hueMax - hueMin);
        let saturation = saturationMin + Math.random() * (saturationMax - saturationMin);
        let value = valueMin + Math.random() * (valueMax - valueMin);
        return this.hsvToHex(hue, saturation, value);
    }
    // params are 0 to 1
    hsvToHex(h: number, s: number, v: number): number {
        let r, g, b;
        let i = Math.floor(h * 6);
        let f = h * 6 - i;
        let p = v * (1 - s);
        let q = v * (1 - f * s);
        let t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
        }
        r = r ?? 0.5;
        g = g ?? 0.5;
        b = b ?? 0.5;
        return parseInt(
            "0x" +
            Math.floor(r * 255).toString(16) +
            Math.floor(g * 255).toString(16) +
            Math.floor(b * 255).toString(16)
        );
    }

    getShapeContent(collider: Rapier.Collider): ShapeContentData | null {
        let shape = collider.shape;
        let parent = collider.parent();
        if (!parent) return null;
        let bodyData = parent.userData as SimuloObjectData;
        let color = bodyData.color;
        let border = bodyData.border;

        let baseShape: ShapeContentData = {
            type: "rectangle",
            color: color,
            border: border,
            id: bodyData.id,
        };

        switch (shape.type) {
            case RAPIER.ShapeType.Cuboid:
                let cuboid = shape as Rapier.Cuboid;
                let halfExtents = cuboid.halfExtents;
                let width = halfExtents.x * 2;
                let height = halfExtents.y * 2;
                let rect: Rectangle = {
                    ...baseShape,
                    type: "rectangle",
                    width: width,
                    height: height,
                };
                return rect;
                break;
            case RAPIER.ShapeType.Ball:
                let ball = shape as Rapier.Ball;
                let radius = ball.radius;
                return {
                    ...baseShape,
                    type: "circle",
                    radius: radius,
                } as Circle;
                break;
            case RAPIER.ShapeType.ConvexPolygon:
                let polygon = shape as Rapier.ConvexPolygon;
                let points: Float32Array = polygon.vertices;
                let pointsArray: [x: number, y: number][] = [];
                for (let i = 0; i < points.length; i += 2) {
                    pointsArray.push([points[i], points[i + 1]]);
                }
                return {
                    ...baseShape,
                    type: "polygon",
                    points: pointsArray,
                } as Polygon;
                break;
            default:
                console.log("Unknown shape type", shape.type);
                break;
        }
        return null;
    }

    getShapeTransforms(): { [id: string]: ShapeTransformData } {
        let transforms: { [id: string]: ShapeTransformData } = {};
        this.colliders.forEach((collider) => {
            let parent = collider.parent();
            if (!parent) return;
            let x = parent.translation().x;
            let y = parent.translation().y;
            let angle = parent.rotation();
            let data = parent.userData as SimuloObjectData;
            transforms[data.id] = {
                x: x,
                y: y,
                angle: angle,
            };
        });
        return transforms;
    }

    springs: SimuloSpring[] = [];

    groundBody: Rapier.RigidBody | null = null;

    async init() {
        await RAPIER.init();

        let gravity = new RAPIER.Vector2(0.0, -9.81);
        let world = new RAPIER.World(gravity);
        this.world = world;

        this.world.maxVelocityIterations = 4;
        this.world.maxVelocityFrictionIterations =
            4 * 2;
        //this.graphics = new Graphics();

        let groundPlane = this.addRectangle(1000, 500, {
            id: "ground",
            color: 0xa1acfa,
            border: 0xffffff,
            name: 'joe',
            sound: 'test',
            borderWidth: 1,
            borderScaleWithZoom: true,
            image: null,
            zDepth: 0,
        }, [0, -510], true);

        let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        this.groundBody = this.world.createRigidBody(groundBodyDesc);

        /*// Create Ground.
        let groundSize = 40.0;
        let grounds = [
            { x: 0.0, y: 0.0, hx: groundSize, hy: 0.1 },
            { x: -groundSize, y: groundSize, hx: 0.1, hy: groundSize },
            { x: groundSize, y: groundSize, hx: 0.1, hy: groundSize },
        ];

        grounds.forEach((ground) => {
            this.addRectangle(ground.hx, ground.hy, {
                id: "ground" + Math.random().toString(),
                color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
                border: 0xffffff,
                name: 'joe',
                sound: 'test',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
            }, [ground.x, ground.y], true);
        });*/
        /*
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
        
                        this.addRectangle(rad, rad, {
                            id: "box" + i.toString() + "-" + j.toString(),
                            color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
                            border: 0xffffff,
                            name: 'joe',
                            sound: 'test',
                            borderWidth: 1,
                            borderScaleWithZoom: true,
                            image: null,
                            zDepth: 0,
                        }, [x, y], false);
                    }
                }*/

        let bodyA = this.addRectangle(5, 1, {
            id: "springboxA",
            color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
            border: 0xffffff,
            name: 'joe',
            sound: 'test',
            borderWidth: 1,
            borderScaleWithZoom: true,
            image: null,
            zDepth: 0,
        }, [-3, 10], false);
        let bodyB = this.addRectangle(1, 1, {
            id: "springboxB",
            color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
            border: 0xffffff,
            name: 'joe',
            sound: 'test',
            borderWidth: 1,
            borderScaleWithZoom: true,
            image: null,
            zDepth: 0,
        }, [5, 5], false);

        /*this.springs.push({
            bodyA: bodyA.parent()!,
            bodyB: bodyB.parent()!,
            stiffness: 0.1,
            // since these are unused and this is prototype code ill delete, using random vars
            localAnchorA: "69 lmao" as any,
            localAnchorB: "real, bro" as any,
            targetLength: 1,
            damping: 0.1
        })*/
    }

    /** multiple gon */
    addPolygon(points: [x: number, y: number][], data: SimuloObjectData, position: [x: number, y: number], isStatic: boolean = false) {
        if (!this.world) { throw new Error('init world first'); }

        let bodyDesc = isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            position[0],
            position[1]
        );
        bodyDesc.setUserData(data);

        let body = this.world.createRigidBody(bodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.convexHull(
            new Float32Array(points.flat()),
        );
        let coll = this.world.createCollider(colliderDesc!, body);
        //this.graphics.addCollider(RAPIER, this.world, coll);
        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[data.id] = content;
        }

        return coll;
    }

    addRectangle(width: number, height: number, data: SimuloObjectData, position: [x: number, y: number], isStatic: boolean) {
        if (!this.world) { throw new Error('init world first'); }
        let bodyDesc = isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            position[0],
            position[1]
        );

        bodyDesc.setUserData(data);
        let body = this.world.createRigidBody(bodyDesc);
        // no collide
        let colliderDesc = RAPIER.ColliderDesc.cuboid(width, height).setRestitution(0.1).setFriction(0.5)//.setCollisionGroups(0)
        let coll = this.world.createCollider(colliderDesc!, body);
        //this.graphics.addCollider(RAPIER, this.world, coll);
        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[data.id] = content;
        }

        return coll;
    }


    step(): SimuloPhysicsStepInfo {
        if (!this.world) { throw new Error('init world first'); }

        let before = new Date().getTime();
        this.springs.forEach((spring) => {
            this.applySpringForce(spring);
        });
        this.world.step();

        let changed = this.changedContents;
        this.changedContents = {};

        return {
            // still very temporary, this isnt a delta but we will make it one soon
            delta: {
                shapeContent: changed,
                shapeTransforms: this.getShapeTransforms(),
            },
            ms: new Date().getTime() - before,
            springs: this.springs.map((spring) => {
                let pointA = this.getWorldPoint(spring.bodyA, spring.localAnchorA);
                let pointB = this.getWorldPoint(spring.bodyB, spring.localAnchorB);
                return {
                    pointA: { x: pointA.x, y: pointA.y },
                    pointB: { x: pointB.x, y: pointB.y },
                }
            })
        };
    }

    getObjectAtPoint(x: number, y: number): Rapier.Collider | null {
        if (!this.world) { throw new Error('init world first'); }
        let point = new RAPIER.Vector2(x, y);
        let proj = this.world.projectPoint(point, true);
        if (proj != null && proj.isInside) {
            return proj.collider;
        }
        return null;
    }

    getShapeContents(): { [id: string]: ShapeContentData } {
        let contents: { [id: string]: ShapeContentData } = {};
        this.colliders.forEach((collider) => {
            let content = this.getShapeContent(collider);
            if (content) {
                contents[content.id] = content;
            }
        });
        return contents;
    }

    normalize(v: Rapier.Vector2): Rapier.Vector2 {
        let len = Math.sqrt(v.x ** 2 + v.y ** 2);
        if (len === 0) return new RAPIER.Vector2(0, 0);
        return new RAPIER.Vector2(v.x / len, v.y / len);
    }

    sub(a: Rapier.Vector2, ...others: Rapier.Vector2[]): Rapier.Vector2 {
        let x = a.x;
        let y = a.y;
        others.forEach((other) => {
            x -= other.x;
            y -= other.y;
        });
        return new RAPIER.Vector2(x, y);
    }

    magnitude(v: Rapier.Vector2): number {
        return Math.sqrt(v.x ** 2 + v.y ** 2);
    }

    distance(a: Rapier.Vector2, b: Rapier.Vector2): number {
        return this.magnitude(this.sub(a, b));
    }

    multiply(v: Rapier.Vector2, s: number): Rapier.Vector2 {
        return new RAPIER.Vector2(v.x * s, v.y * s);
    }

    vecToString(v: Rapier.Vector2): string {
        return `(${v.x}, ${v.y})`;
    }

    add(a: Rapier.Vector2, ...others: Rapier.Vector2[]): Rapier.Vector2 {
        let x = a.x;
        let y = a.y;
        others.forEach((other) => {
            x += other.x;
            y += other.y;
        });
        return new RAPIER.Vector2(x, y);
    }

    dot(a: Rapier.Vector2, b: Rapier.Vector2): number {
        return a.x * b.x + a.y * b.y;
    }

    cross(a: Rapier.Vector2, b: Rapier.Vector2): Rapier.Vector2 {
        return new RAPIER.Vector2(a.x * b.y, -a.y * b.x);
    }

    combineCoefficients(dt: number, stiffness: number, damping: number): [erp_inv_dt: number, no_one_knows: number, cfm_gain: number] {
        const inv = (val: number) => 1 / val;
        const erp_inv_dt = stiffness * inv(dt * stiffness + damping);
        const cfm_gain = inv(dt * dt * stiffness + dt * damping);
        return [erp_inv_dt, 0.0, cfm_gain];
    }

    /** local point factoring in both position and rotation of body, with fancy Math. functions like math.cos */
    getLocalPoint(body: RAPIER.RigidBody, worldPoint: RAPIER.Vector2) {
        const bodyPosition = body.translation();
        const bodyRotation = body.rotation();
        const cos = Math.cos(bodyRotation);
        const sin = Math.sin(bodyRotation);
        const x = worldPoint.x - bodyPosition.x;
        const y = worldPoint.y - bodyPosition.y;
        const localX = x * cos + y * sin;
        const localY = -x * sin + y * cos;
        return new RAPIER.Vector2(localX, localY);
    }
    getWorldPoint(body: RAPIER.RigidBody, localPoint: RAPIER.Vector2) {
        const bodyPosition = body.translation();
        const bodyRotation = body.rotation();
        const cos = Math.cos(bodyRotation);
        const sin = Math.sin(bodyRotation);
        const x = localPoint.x;
        const y = localPoint.y;
        const worldX = x * cos - y * sin + bodyPosition.x;
        const worldY = x * sin + y * cos + bodyPosition.y;
        return new RAPIER.Vector2(worldX, worldY);
    }
    applySpringForce(spring: SimuloSpring) {
        const pointAWorld = this.getWorldPoint(spring.bodyA, spring.localAnchorA);
        const pointBWorld = this.getWorldPoint(spring.bodyB, spring.localAnchorB);

        const velA = spring.bodyA.linvel();
        const velB = spring.bodyB.linvel();
        const springVector = this.sub(pointBWorld, pointAWorld);
        const distance = this.magnitude(springVector);
        const direction = this.normalize(springVector);
        //const forceMagnitude = spring.stiffness * (distance - spring.targetLength);
        const forceMagnitude = spring.stiffness * (distance - spring.targetLength) + (spring.damping);

        const forceOnA = this.multiply(direction, forceMagnitude);
        const forceOnB = this.multiply(direction, -forceMagnitude);

        spring.bodyA.applyImpulseAtPoint(forceOnA, pointAWorld, true);
        spring.bodyB.applyImpulseAtPoint(forceOnB, pointBWorld, true);
    }/*
    applySpringForce(spring: SimuloSpring, deltaTime: number = 1 / 60) {,
        const pointAWorld = spring.bodyA.translation();
        const pointBWorld = spring.bodyB.translation();
        const springVector = this.sub(pointBWorld, pointAWorld);
        const distance = this.magnitude(springVector);
        const direction = this.normalize(springVector);
        const forceMagnitude = -spring.stiffness * (distance - spring.targetLength);

        const forceOnA = this.multiply(direction, forceMagnitude);
        const forceOnB = this.multiply(direction, -forceMagnitude);

        spring.bodyA.addForce(forceOnA, true);
        spring.bodyB.addForce(forceOnB, true);
    }*/
}

export default SimuloPhysicsServerRapier;
export type { ShapeContentData, Polygon, Rectangle, Circle, ShapeTransformData, SimuloPhysicsStepInfo };