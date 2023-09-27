import RAPIER from "@dimforge/rapier2d-compat";
import type Rapier from "@dimforge/rapier2d-compat";

import randomColor from "../randomColor";

import SimuloObjectData from "../SimuloObjectData";

interface ShapeContentData {
    id: string;
    type: "cuboid" | "ball" | "polygon" | "line";
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

/** Translation and rotation to apply to a shape. Scale is not included in this (and is instead in `ShapeContentData`) since it rarely changes, unlike position and rotation, which usually change every frame. */
interface ShapeTransformData {
    x: number;
    y: number;
    z: number;
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

    sounds: CollisionSound[];
}

interface SavedWorldState {
    state: number[];
    userDatas: { [handle: number]: SimuloObjectData };
    currentIDs: { [container: string]: number };
    springs: {
        bodyA: string | null;
        bodyB: string | null;
        localAnchorA: { x: number, y: number };
        localAnchorB: { x: number, y: number };
        stiffness: number;
        damping: number;
        targetLength: number;
        id: string;
    }[];
}

/** Simulo creates fake spring joint with `applyImpulseAtPoint` on two bodies.
 * 
 * Since you provide your own functions like `getBodyAPosition`, this is general-purpose, and you can do things like attach one end to a mouse cursor. */

interface SimuloSpringDesc {
    bodyA: string | null;
    bodyB: string | null;

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

/** Interactive class for Simulo spring */
class SimuloSpring {
    readonly id: string;
    private desc: SimuloSpringDesc;
    private server: SimuloPhysicsServerRapier;
    constructor(server: SimuloPhysicsServerRapier, desc: SimuloSpringDesc, id: string) {
        this.id = id;
        this.desc = desc;
        this.server = server;
    }
    get targetLength(): number {
        return this.desc.targetLength;
    }
    set targetLength(value: number) {
        this.desc.targetLength = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get damping(): number {
        return this.desc.damping;
    }
    set damping(value: number) {
        this.desc.damping = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get stiffness(): number {
        return this.desc.stiffness;
    }
    set stiffness(value: number) {
        this.desc.stiffness = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get localAnchorA(): { x: number, y: number } {
        return this.desc.localAnchorA;
    }
    set localAnchorA(value: { x: number, y: number }) {
        this.desc.localAnchorA = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get localAnchorB(): { x: number, y: number } {
        return this.desc.localAnchorB;
    }
    set localAnchorB(value: { x: number, y: number }) {
        this.desc.localAnchorB = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyAPosition(): () => { x: number, y: number } {
        return this.desc.getBodyAPosition;
    }
    set getBodyAPosition(value: () => { x: number, y: number }) {
        this.desc.getBodyAPosition = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyBPosition(): () => { x: number, y: number } {
        return this.desc.getBodyBPosition;
    }
    set getBodyBPosition(value: () => { x: number, y: number }) {
        this.desc.getBodyBPosition = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyARotation(): () => number {
        return this.desc.getBodyARotation;
    }
    set getBodyARotation(value: () => number) {
        this.desc.getBodyARotation = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyBRotation(): () => number {
        return this.desc.getBodyBRotation;
    }
    set getBodyBRotation(value: () => number) {
        this.desc.getBodyBRotation = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyAVelocity(): () => { x: number, y: number } {
        return this.desc.getBodyAVelocity;
    }
    set getBodyAVelocity(value: () => { x: number, y: number }) {
        this.desc.getBodyAVelocity = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get getBodyBVelocity(): () => { x: number, y: number } {
        return this.desc.getBodyBVelocity;
    }
    set getBodyBVelocity(value: () => { x: number, y: number }) {
        this.desc.getBodyBVelocity = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get applyBodyAImpulse(): (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => void {
        return this.desc.applyBodyAImpulse;
    }
    set applyBodyAImpulse(value: (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => void) {
        this.desc.applyBodyAImpulse = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    get applyBodyBImpulse(): (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => void {
        return this.desc.applyBodyBImpulse;
    }
    set applyBodyBImpulse(value: (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => void) {
        this.desc.applyBodyBImpulse = value;
        if (this.server.springs[this.id]) {
            this.server.springs[this.id] = this.desc;
        }
    }
    destroy() {
        delete this.server.springs[this.id];
    }
}

/** The spring data needed for rendering */

interface SimuloSpringInfo {
    pointA: { x: number, y: number };
    pointB: { x: number, y: number };
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

    currentIDs: { [container: string]: number } = {};

    /** Get a unique ID in a container. This will just be the previous number plus one. */
    getID(container: string, absolute: boolean = true): string {
        if (!this.currentIDs[container]) {
            this.currentIDs[container] = 0;
        }
        let id = this.currentIDs[container];
        // console.log('Allocated ID `' + container + id + '`');
        this.currentIDs[container]++;
        if (absolute) {
            return container + id;
        }
        return id.toString();
    }

    /** Simulo uses virtual springs with impulses applied each frame, since Rapier doesn't have built-in springs */
    springs: { [id: string]: SimuloSpringDesc } = {};

    /** Add a spring */
    addSpring(spring: SimuloSpringDesc): SimuloSpring {
        let id = this.getID("/");
        this.springs[id] = spring;
        return new SimuloSpring(this, spring, id);
    }

    getShapeContent(collider: Rapier.Collider): ShapeContentData | null {
        let shape = collider.shape;
        let parent = collider.parent();
        if (!parent) return null;
        let bodyData = parent.userData as SimuloObjectData;
        let color = bodyData.color;
        let border = bodyData.border;

        let baseShape: ShapeContentData = {
            type: "cuboid",
            color: color,
            alpha: bodyData.alpha,
            border: border,
            id: bodyData.id,
            borderWidth: bodyData.borderWidth,
        };

        switch (shape.type) {
            case RAPIER.ShapeType.Cuboid:
                let cuboid = shape as Rapier.Cuboid;
                let halfExtents = cuboid.halfExtents;
                let width = halfExtents.x * 2;
                let height = halfExtents.y * 2;
                let rect: Cuboid = {
                    ...baseShape,
                    type: "cuboid",
                    width: width,
                    height: height,
                    depth: 1,
                };
                return rect;
                break;
            case RAPIER.ShapeType.Ball:
                let ball = shape as Rapier.Ball;
                let radius = ball.radius;
                return {
                    ...baseShape,
                    type: "ball",
                    radius: radius,
                } as Ball;
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
                z: 0,
                angle: angle,
            };
        });
        return transforms;
    }

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
            color: 0xa1acfa,
            alpha: 1,
            border: null,
            name: 'joe',
            sound: '/assets/sounds/impact.wav',
            borderWidth: 1,
            borderScaleWithZoom: true,
            image: null,
            zDepth: 0,
            position: { x: 0, y: -510 },
            isStatic: true,
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        });



        {
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
                    width: ground.hx, height: ground.hy,
                    color: randomColor(0, 1, 0.5, 0.8, 0.8, 1),
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
                    density: 1,
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
                        width: rad, height: rad,
                        color: randomColor(0, 1, 0.3, 0.8, 0.4, 1),
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
    }

    /** multiple gon */
    addPolygon(polygon: BaseShapeData & {
        points: { x: number, y: number }[],
    }) {
        if (!this.world) { throw new Error('init world first'); }

        let id = polygon.id ?? this.getID("/");

        let bodyDesc = polygon.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();

        bodyDesc = bodyDesc.setTranslation(
            polygon.position.x,
            polygon.position.y
        );

        bodyDesc.setUserData({
            id,
            color: polygon.color,
            alpha: polygon.alpha,
            border: polygon.border,
            name: polygon.name,
            sound: polygon.sound,
            borderWidth: polygon.borderWidth,
            borderScaleWithZoom: polygon.borderScaleWithZoom,
            image: polygon.image,
            zDepth: polygon.zDepth,
        });

        let body = this.world.createRigidBody(bodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.convexHull(
            new Float32Array(polygon.points.flatMap((point) => [point.x, point.y]))
        );

        if (!colliderDesc) {
            throw new Error('Failed to create collider');
        }

        colliderDesc = colliderDesc.setRestitution(polygon.restitution).setFriction(polygon.friction).setDensity(polygon.density)
            .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[id] = content;
        }

        return coll;
    }

    addRectangle(rectangle: BaseShapeData & {
        width: number,
        height: number,
    }) {
        if (!this.world) { throw new Error('init world first'); }

        let id = rectangle.id ?? this.getID("/");

        let bodyDesc = rectangle.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            rectangle.position.x,
            rectangle.position.y
        );

        bodyDesc.setUserData({
            id,
            color: rectangle.color,
            alpha: rectangle.alpha,
            border: rectangle.border,
            name: rectangle.name,
            sound: rectangle.sound,
            borderWidth: rectangle.borderWidth,
            borderScaleWithZoom: rectangle.borderScaleWithZoom,
            image: rectangle.image,
            zDepth: rectangle.zDepth,
        });

        let body = this.world.createRigidBody(bodyDesc);
        // no collide
        let colliderDesc = RAPIER.ColliderDesc.cuboid(rectangle.width, rectangle.height).setRestitution(rectangle.restitution).setFriction(rectangle.friction).setDensity(rectangle.density)
            .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[id] = content;
        }

        return coll;
    }

    addCircle(circle: BaseShapeData & {
        radius: number,
    }) {
        if (!this.world) { throw new Error('init world first'); }

        let id = circle.id ?? this.getID("/");

        let bodyDesc = circle.isStatic ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
        bodyDesc = bodyDesc.setTranslation(
            circle.position.x,
            circle.position.y
        );

        bodyDesc.setUserData({
            id,
            color: circle.color,
            alpha: circle.alpha,
            border: circle.border,
            name: circle.name,
            sound: circle.sound,
            borderWidth: circle.borderWidth,
            borderScaleWithZoom: circle.borderScaleWithZoom,
            image: circle.image,
            zDepth: circle.zDepth,
        });

        let body = this.world.createRigidBody(bodyDesc);
        // no collide
        let colliderDesc = RAPIER.ColliderDesc.ball(circle.radius).setRestitution(circle.restitution).setFriction(circle.friction).setDensity(circle.density)
            .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[id] = content;
        }

        return coll;
    }

    eventQueue: RAPIER.EventQueue | null = null;

    step(): SimuloPhysicsStepInfo {
        if (!this.world) { throw new Error('init world first'); }

        let before = new Date().getTime();
        Object.values(this.springs).forEach((spring) => {
            this.applySpringForce(spring);
        });
        if (!this.eventQueue) {
            this.eventQueue = new RAPIER.EventQueue(true);
        }

        this.world.step(this.eventQueue);

        let sounds: CollisionSound[] = [];

        this.eventQueue.drainContactForceEvents(e => {
            //console.log(e.totalForceMagnitude);
            let colliderA = this.world?.getCollider(e.collider1());
            let colliderB = this.world?.getCollider(e.collider2());
            let bodyA = colliderA?.parent();
            let bodyB = colliderB?.parent();
            let userDataA = bodyA?.userData as SimuloObjectData;
            let userDataB = bodyB?.userData as SimuloObjectData;
            let magnitude = e.totalForceMagnitude() / 100000;
            if (userDataA.sound) {
                sounds.push({
                    sound: userDataA.sound,
                    volume: magnitude,
                });
            }
            if (userDataB.sound) {
                sounds.push({
                    sound: userDataB.sound,
                    volume: magnitude,
                });
            }
        });

        let changed = this.changedContents;
        this.changedContents = {};

        return {
            delta: {
                shapeContent: changed,
                shapeTransforms: this.getShapeTransforms(), // this should be changed to a delta since lots of bodies are sleeping
            },
            ms: new Date().getTime() - before,
            springs: Object.values(this.springs).map((spring) => {
                let pointA = this.getWorldPoint(spring.getBodyAPosition(), spring.getBodyARotation(), spring.localAnchorA);
                let pointB = this.getWorldPoint(spring.getBodyBPosition(), spring.getBodyBRotation(), spring.localAnchorB);
                return {
                    pointA: { x: pointA.x, y: pointA.y },
                    pointB: { x: pointB.x, y: pointB.y },
                }
            }),
            sounds: sounds,
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
                console.log('got of ID "' + content.id + '"')
                contents[content.id] = content;
            }
            else {
                console.log('no content for collider', collider);
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

    applySpringForce(spring: SimuloSpringDesc) {
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

    saveScene(): SavedWorldState {
        if (!this.world) { throw new Error('init world first'); }
        let state: Uint8Array = this.world.takeSnapshot();
        if (!state) {
            throw new Error('Failed to save scene');
        }
        let userDatas: {
            [handle: number]: SimuloObjectData;
        } = Object.fromEntries(this.colliders.map((collider) => {
            let parent = collider.parent();
            if (!parent) return null;
            let userData = parent.userData as SimuloObjectData;
            return [parent.handle, userData];
        }).filter((x) => x != null) as [number, SimuloObjectData][]);

        return {
            state: Array.from(state),
            userDatas,
            currentIDs: this.currentIDs,
            springs: Object.keys(this.springs).map((id) => {
                return {
                    bodyA: this.springs[id].bodyA,
                    bodyB: this.springs[id].bodyB,
                    localAnchorA: this.springs[id].localAnchorA,
                    localAnchorB: this.springs[id].localAnchorB,
                    stiffness: this.springs[id].stiffness,
                    damping: this.springs[id].damping,
                    targetLength: this.springs[id].targetLength,
                    id,
                }
            })
        };
    }

    getObjectByID(id: string): Rapier.RigidBody | null {
        if (!this.world) { throw new Error('init world first'); }
        let bodies = this.world.bodies.getAll();
        let body = bodies.find((body) => {
            let userData = body.userData as SimuloObjectData;
            return userData.id === id;
        });

        return body ?? null;
    }

    /** Real */
    async initFromSaved(scene: SavedWorldState) {
        await RAPIER.init();

        let state = scene.state;

        this.world = RAPIER.World.restoreSnapshot(Uint8Array.from(state));

        this.colliders = this.world.colliders.getAll();

        // restore user data
        this.colliders.forEach((collider) => {
            let parent = collider.parent();
            if (!parent) return;
            let userData = scene.userDatas[parent.handle];
            if (!userData) return;
            parent.userData = userData;
        });

        this.changedContents = this.getShapeContents();

        this.currentIDs = scene.currentIDs;

        // add springs manually so we can use the right IDs
        scene.springs.forEach((spring) => {
            let bodyA: RAPIER.RigidBody | null = null;
            let bodyB: RAPIER.RigidBody | null = null;
            if (spring.bodyA) {
                bodyA = this.getObjectByID(spring.bodyA);
            }
            if (spring.bodyB) {
                bodyB = this.getObjectByID(spring.bodyB);
            }

            this.springs[spring.id] = {
                bodyA: spring.bodyA,
                bodyB: spring.bodyB,

                stiffness: spring.stiffness,
                damping: spring.damping,
                targetLength: spring.targetLength,

                localAnchorA: spring.localAnchorA,
                localAnchorB: spring.localAnchorB,

                getBodyAPosition: () => {
                    if (bodyA == null) return { x: 0, y: 0 };
                    return bodyA.translation();
                },
                getBodyBPosition: () => {
                    if (bodyB == null) return { x: 0, y: 0 };
                    return bodyB.translation();
                },
                getBodyARotation: () => {
                    if (bodyA == null) return 0;
                    return bodyA.rotation();
                },
                getBodyBRotation: () => {
                    if (bodyB == null) return 0;
                    return bodyB.rotation();
                },
                getBodyAVelocity: () => {
                    if (bodyA == null) return { x: 0, y: 0 };
                    return bodyA.linvel();
                },
                getBodyBVelocity: () => {
                    if (bodyB == null) return { x: 0, y: 0 };
                    return bodyB.linvel();
                },
                applyBodyAImpulse: (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => {
                    if (bodyA == null) return;
                    bodyA.applyImpulseAtPoint(impulse, worldPoint, true);
                },
                applyBodyBImpulse: (impulse: { x: number, y: number }, worldPoint: { x: number, y: number }) => {
                    if (bodyB == null) return;
                    bodyB.applyImpulseAtPoint(impulse, worldPoint, true);
                },


            };
        })
    }
}

export default SimuloPhysicsServerRapier;
export type { ShapeContentData, Polygon, Cuboid, Ball, ShapeTransformData, SimuloPhysicsStepInfo, SimuloSpring };