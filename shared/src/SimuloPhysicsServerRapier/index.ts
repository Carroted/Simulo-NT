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

/** Translation and rotation to apply to a shape. Scale is not included in this (and is instead in `ShapeContentData`) since it rarely changes, unlike position and rotation, which usually change every frame. */
interface ShapeTransformData {
    x: number;
    y: number;
    angle: number;
}

interface SimuloPhysicsStepInfo {
    delta: {
        /** Shape content that has changed since last step. */
        shapeContent: { [id: string]: ShapeContentData };

        /** New positioning and rotation of shape contents. */
        shapeTransforms: { [id: string]: ShapeTransformData };
    };

    ms: number;

    /** Spring rendering data */
    springs: SimuloSpringInfo[];
}

/** Simulo creates fake spring joint with `applyImpulseAtPoint` on two bodies.
 * 
 * Since you provide your own functions like `getBodyAPosition`, this is general-purpose, and you can do things like attach one end to a mouse cursor. */

interface SimuloSpring {
    getBodyAPosition: () => Rapier.Vector2;
    getBodyBPosition: () => Rapier.Vector2;

    getBodyARotation: () => number;
    getBodyBRotation: () => number;

    getBodyAVelocity: () => Rapier.Vector2;
    getBodyBVelocity: () => Rapier.Vector2;

    applyBodyAImpulse: (impulse: Rapier.Vector2, worldPoint: Rapier.Vector2) => void;
    applyBodyBImpulse: (impulse: Rapier.Vector2, worldPoint: Rapier.Vector2) => void;

    localAnchorA: Rapier.Vector2;
    localAnchorB: Rapier.Vector2;

    /** Multiplier of spring impulse */
    stiffness: number;

    /** Dampens spring, stopping it from infinitely oscillating */
    damping: number;

    /** Target length is also known as rest length. We chose to call it target length because it's more descriptive of how it's used. */
    targetLength: number;
}

/** The spring data needed for rendering */

interface SimuloSpringInfo {
    pointA: { x: number, y: number };
    pointB: { x: number, y: number };
}

class SimuloPhysicsServerRapier {
    world: Rapier.World | null = null;
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

    /** Random hex number like `0xffffff` */
    randomColor(hueMin: number, hueMax: number, saturationMin: number, saturationMax: number, valueMin: number, valueMax: number): number {
        let hue = hueMin + Math.random() * (hueMax - hueMin);
        let saturation = saturationMin + Math.random() * (saturationMax - saturationMin);
        let value = valueMin + Math.random() * (valueMax - valueMin);
        return this.hsvToHex(hue, saturation, value);
    }

    /** HSV (0-1) to hex number like `0xffffff` */
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

    /** Simulo uses virtual springs with impulses applied each frame, since Rapier doesn't have built-in springs */
    springs: SimuloSpring[] = [];

    /** There is no constructor, but that's fine since you can set this before calling `init` */
    gravity: { x: number; y: number } = { x: 0, y: -9.81 };

    async init() {
        await RAPIER.init();

        let gravity = new RAPIER.Vector2(this.gravity.x, this.gravity.y);
        let world = new RAPIER.World(gravity);
        this.world = world;

        this.world.maxVelocityIterations = 4;
        this.world.maxVelocityFrictionIterations =
            4 * 2;

        let groundPlane = this.addRectangle({
            width: 1000,
            height: 500,
            data: {
                id: "ground",
                color: 0xa1acfa,
                border: 0xffffff,
                name: 'joe',
                sound: 'test',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
            },
            position: { x: 0, y: -510 },
            isStatic: true,
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        });

        let bodyA = this.addRectangle({
            width: 5, height: 1,
            data: {
                id: "springboxA",
                color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
                border: 0xffffff,
                name: 'joe',
                sound: 'test',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
            },
            position: { x: -3, y: 10 },
            isStatic: false,
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        });

        let bodyB = this.addRectangle({
            width: 1, height: 1,
            data: {
                id: "springboxB",
                color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
                border: 0xffffff,
                name: 'joe',
                sound: 'test',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
            },
            position: { x: 5, y: 5 },
            isStatic: false,
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        });

        let bodyC = this.addCircle({
            radius: 3,
            data: {
                id: "springcirclelmao",
                color: this.randomColor(0, 1, 0.5, 0.8, 0.8, 1),
                border: 0xffffff,
                name: 'joe',
                sound: 'test',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
            },
            position: { x: 0, y: 0 },
            isStatic: false,
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        });
    }

    /** multiple gon */
    addPolygon(polygon: {
        points: { x: number, y: number }[],
        data: SimuloObjectData,
        position: { x: number, y: number },
        isStatic: boolean,
        friction: number,
        restitution: number,
        density: number,
    }) {
        if (!this.world) { throw new Error('init world first'); }

        let bodyDesc = polygon.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();

        bodyDesc = bodyDesc.setTranslation(
            polygon.position.x,
            polygon.position.y
        );

        bodyDesc.setUserData(polygon.data);

        let body = this.world.createRigidBody(bodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.convexHull(
            new Float32Array(polygon.points.flatMap((point) => [point.x, point.y]))
        );

        if (!colliderDesc) {
            throw new Error('Failed to create collider');
        }

        colliderDesc = colliderDesc.setRestitution(polygon.restitution).setFriction(polygon.friction).setDensity(polygon.density);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[polygon.data.id] = content;
        }

        return coll;
    }

    addRectangle(rectangle: {
        width: number,
        height: number,
        data: SimuloObjectData,
        position: { x: number, y: number }
        isStatic: boolean,
        friction: number,
        restitution: number,
        density: number,
    }) {
        if (!this.world) { throw new Error('init world first'); }
        let bodyDesc = rectangle.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            rectangle.position.x,
            rectangle.position.y
        );

        bodyDesc.setUserData(rectangle.data);
        let body = this.world.createRigidBody(bodyDesc);
        // no collide
        let colliderDesc = RAPIER.ColliderDesc.cuboid(rectangle.width, rectangle.height).setRestitution(rectangle.restitution).setFriction(rectangle.friction).setDensity(rectangle.density);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[rectangle.data.id] = content;
        }

        return coll;
    }

    addCircle(circle: {
        radius: number,
        data: SimuloObjectData,
        position: { x: number, y: number },
        isStatic: boolean,
        friction: number,
        restitution: number,
        density: number,
    }) {
        if (!this.world) { throw new Error('init world first'); }
        let bodyDesc = circle.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            circle.position.x,
            circle.position.y
        );

        bodyDesc.setUserData(circle.data);
        let body = this.world.createRigidBody(bodyDesc);
        // no collide
        let colliderDesc = RAPIER.ColliderDesc.ball(circle.radius).setRestitution(circle.restitution).setFriction(circle.friction).setDensity(circle.density);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[circle.data.id] = content;
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
            delta: {
                shapeContent: changed,
                shapeTransforms: this.getShapeTransforms(), // this should be changed to a delta since lots of bodies are sleeping
            },
            ms: new Date().getTime() - before,
            springs: this.springs.map((spring) => {
                let pointA = this.getWorldPoint(spring.getBodyAPosition(), spring.getBodyARotation(), spring.localAnchorA);
                let pointB = this.getWorldPoint(spring.getBodyBPosition(), spring.getBodyBRotation(), spring.localAnchorB);
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

    /** Convert a world point to a local point */
    getLocalPoint(bodyPosition: RAPIER.Vector2, bodyRotation: number, worldPoint: RAPIER.Vector2) {
        const cos = Math.cos(bodyRotation);
        const sin = Math.sin(bodyRotation);
        const x = worldPoint.x - bodyPosition.x;
        const y = worldPoint.y - bodyPosition.y;
        const localX = x * cos + y * sin;
        const localY = -x * sin + y * cos;
        return new RAPIER.Vector2(localX, localY);
    }

    /** Convert a local point to a world point */
    getWorldPoint(bodyPosition: RAPIER.Vector2, bodyRotation: number, localPoint: RAPIER.Vector2) {
        const cos = Math.cos(bodyRotation);
        const sin = Math.sin(bodyRotation);
        const x = localPoint.x;
        const y = localPoint.y;
        const worldX = x * cos - y * sin + bodyPosition.x;
        const worldY = x * sin + y * cos + bodyPosition.y;
        return new RAPIER.Vector2(worldX, worldY);
    }

    applySpringForce(spring: SimuloSpring) {
        const pointAWorld = this.getWorldPoint(spring.getBodyAPosition(), spring.getBodyARotation(), spring.localAnchorA);
        const pointBWorld = this.getWorldPoint(spring.getBodyBPosition(), spring.getBodyBRotation(), spring.localAnchorB);

        // will be used soon. if these unused consts bother you, consider adding them to the fomula :)
        const velA = spring.getBodyAVelocity();
        const velB = spring.getBodyBVelocity();

        const springVector = this.sub(pointBWorld, pointAWorld);
        const distance = this.magnitude(springVector);
        if (distance == 0) return;

        const direction = this.normalize(springVector);

        //const forceMagnitude = spring.stiffness * (distance - spring.targetLength) + (spring.damping);
        const forceMagnitudeA = spring.stiffness * (distance - spring.targetLength) - (spring.damping * (this.dot(springVector, velA) / distance));
        const forceMagnitudeB = -spring.stiffness * (distance - spring.targetLength) - (spring.damping * (this.dot(springVector, velB) / distance));

        const forceOnA = this.multiply(direction, forceMagnitudeA);
        const forceOnB = this.multiply(direction, forceMagnitudeB);

        spring.applyBodyAImpulse(forceOnA, pointAWorld);
        spring.applyBodyBImpulse(forceOnB, pointBWorld);
    }
}

export default SimuloPhysicsServerRapier;
export type { ShapeContentData, Polygon, Rectangle, Circle, ShapeTransformData, SimuloPhysicsStepInfo };