import RAPIER from "@dimforge/rapier2d-compat";
import type Rapier from "@dimforge/rapier2d-compat";

import randomColor from "../randomColor";

import SimuloObjectData from "../SimuloObjectData";

import polygonSplitter from 'polygon-splitter';
import polygonDecomp from 'poly-decomp';

import ShapeContentData from "../ShapeContentData";

import { Cuboid, Polygon, Ball } from "../ShapeContentData";
import ShapeTransformData from "../ShapeTransformData";
import CollisionSound from "../CollisionSound";
import SimuloPhysicsStepInfo from "../SimuloPhysicsStepInfo";
import SavedWorldState from "../SavedWorldState";

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

    getBodyAAngularVelocity: () => number;
    getBodyBAngularVelocity: () => number;

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

import BaseShapeData from "../BaseShapeData";
import SimuloPhysicsServer from "../SimuloPhysicsServer";
import SimuloObject from "../SimuloObject";

class SimuloPhysicsServerRapier implements SimuloPhysicsServer {
    world: Rapier.World | null = null;
    listeners: { [key: string]: Function[] } = {};
    colliders: Rapier.Collider[] = [];
    changedContents: { [id: string]: ShapeContentData } = {};
    removedContents: string[] = [];

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
    addSpring(spring: {
        objectA: SimuloObject | null; // null means world
        objectB: SimuloObject | null; // null means world
        stiffness: number;
        damping: number;
        restLength: number;
        localAnchorA: { x: number, y: number, z: number };
        localAnchorB: { x: number, y: number, z: number };
    }): SimuloSpring {
        let id = this.getID("/");
        let springDesc: SimuloSpringDesc = {
            applyBodyAImpulse: (impulse: Rapier.Vector2, worldPoint: Rapier.Vector2) => {
                if (spring.objectA) {
                    if (spring.objectA.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectA.reference as RAPIER.RigidBody;
                        body.applyImpulseAtPoint(impulse, worldPoint, true);
                    }
                }
            },
            applyBodyBImpulse: (impulse: Rapier.Vector2, worldPoint: Rapier.Vector2) => {
                if (spring.objectB) {
                    if (spring.objectB.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectB.reference as RAPIER.RigidBody;
                        body.applyImpulseAtPoint(impulse, worldPoint, true);
                    }
                }
            },
            getBodyAPosition: () => {
                if (spring.objectA) {
                    if (spring.objectA.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectA.reference as RAPIER.RigidBody;
                        return body.translation();
                    }
                }
                return new RAPIER.Vector2(0, 0);
            },
            getBodyBPosition: () => {
                if (spring.objectB) {
                    if (spring.objectB.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectB.reference as RAPIER.RigidBody;
                        return body.translation();
                    }
                }
                return new RAPIER.Vector2(0, 0);
            },
            getBodyARotation: () => {
                if (spring.objectA) {
                    if (spring.objectA.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectA.reference as RAPIER.RigidBody;
                        return body.rotation();
                    }
                }
                return 0;
            },
            getBodyBRotation: () => {
                if (spring.objectB) {
                    if (spring.objectB.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectB.reference as RAPIER.RigidBody;
                        return body.rotation();
                    }
                }
                return 0;
            },
            getBodyAVelocity: () => {
                if (spring.objectA) {
                    if (spring.objectA.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectA.reference as RAPIER.RigidBody;
                        return body.linvel();
                    }
                }
                return new RAPIER.Vector2(0, 0);
            },
            getBodyBVelocity: () => {
                if (spring.objectB) {
                    if (spring.objectB.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectB.reference as RAPIER.RigidBody;
                        return body.linvel();
                    }
                }
                return new RAPIER.Vector2(0, 0);
            },
            getBodyAAngularVelocity: () => {
                if (spring.objectA) {
                    if (spring.objectA.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectA.reference as RAPIER.RigidBody;
                        return body.angvel();
                    }
                }
                return 0;
            },
            getBodyBAngularVelocity: () => {
                if (spring.objectB) {
                    if (spring.objectB.reference instanceof RAPIER.RigidBody) {
                        let body = spring.objectB.reference as RAPIER.RigidBody;
                        return body.angvel();
                    }
                }
                return 0;
            },
            bodyA: spring.objectA ? spring.objectA.id : null,
            bodyB: spring.objectB ? spring.objectB.id : null,
            localAnchorA: new RAPIER.Vector2(spring.localAnchorA.x, spring.localAnchorA.y),
            localAnchorB: new RAPIER.Vector2(spring.localAnchorB.x, spring.localAnchorB.y),
            stiffness: spring.stiffness,
            damping: spring.damping,
            targetLength: spring.restLength,
        };
        this.springs[id] = springDesc;
        return new SimuloSpring(this, springDesc, id);
    }

    addAxle(axle: {
        bodyA: Rapier.RigidBody;
        bodyB: Rapier.RigidBody;
        localAnchorA: Rapier.Vector2;
        localAnchorB: Rapier.Vector2;
    }) {
        if (!this.world) { throw new Error('init world first'); }

        let params = RAPIER.JointData.revolute(axle.localAnchorA, axle.localAnchorB);
        let joint = this.world.createImpulseJoint(params, axle.bodyA, axle.bodyB, true);
        // all of each bodys collider collision groups need to be adjusted
        let colliderACount = axle.bodyA.numColliders();
        let colliderBCount = axle.bodyB.numColliders();
        for (let i = 0; i < colliderACount; i++) {
            let collider = axle.bodyA.collider(i);
            collider.setCollisionGroups(0);
        }
        for (let i = 0; i < colliderBCount; i++) {
            let collider = axle.bodyB.collider(i);
            collider.setCollisionGroups(0);
        }
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
            name: bodyData.name ?? "Some kind of object",
            description: null
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
                    // the depth is the min of width and height, but max of 5
                    depth: Math.min(Math.max(width, height), 5),
                };
                return rect;
            case RAPIER.ShapeType.Ball:
                let ball = shape as Rapier.Ball;
                let radius = ball.radius;
                return {
                    ...baseShape,
                    type: "ball",
                    radius: radius,
                } as Ball;
            case RAPIER.ShapeType.ConvexPolygon:
                if (bodyData.polygonPoints) {
                    return {
                        ...baseShape,
                        type: "polygon",
                        points: bodyData.polygonPoints.map((point) => [point.x, point.y]),
                    } as Polygon;
                }
                else {
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
                }
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

        let groundPlane = this.addCuboid({
            width: 2000,
            height: 1000,
            depth: 1,
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
                this.addCuboid({
                    width: ground.hx * 2, height: ground.hy * 2, depth: 1,
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
                    this.addCuboid({
                        width: rad * 2, height: rad * 2, depth: 1,
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
    }): SimuloObject {
        if (!this.world) { throw new Error('init world first'); }
        let pointsRaw = polygon.points.map((point) => [point.x, point.y]);
        if (!polygonDecomp.isSimple(pointsRaw)) {
            //throw new Error('Polygon is not simple, stop being so interesting, complex and unique');
        }

        polygonDecomp.makeCCW(pointsRaw);
        polygonDecomp.removeDuplicatePoints(pointsRaw, 0.01);
        polygonDecomp.removeCollinearPoints(pointsRaw, 0.1);

        let polygons: number[][][] = polygonDecomp.quickDecomp(pointsRaw);
        let colliders: Rapier.Collider[] = [];

        console.log('count of polygons is', polygons.length);

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
            polygonPoints: polygon.points,
        });

        let body = this.world.createRigidBody(bodyDesc);

        for (let points of polygons) {
            // remove duplicates
            polygonDecomp.removeDuplicatePoints(points, 0.01);
            polygonDecomp.removeCollinearPoints(points, 0.1);
            points.push(points[0]);

            // make sure theres no nans or nulls or undefineds, if there is, continue
            if (points.some((point) => {
                return (point === undefined) || (point === null) || !Array.isArray(point) || point.some((coord) => {
                    return (coord === undefined) || (coord === null) || isNaN(coord);
                });
            })) {
                continue;
            }



            console.log('points is', points)
            let colliderDesc = RAPIER.ColliderDesc.convexHull(
                new Float32Array(points.flat())
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

            colliders.push(coll);
        }

        return this.getSimuloObject(body);
    }

    addCuboid(rectangle: BaseShapeData & {
        width: number,
        height: number,
        depth: number
    }): SimuloObject {
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
        let colliderDesc = RAPIER.ColliderDesc.cuboid(rectangle.width / 2, rectangle.height / 2).setRestitution(rectangle.restitution).setFriction(rectangle.friction).setDensity(rectangle.density)
            .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
        let coll = this.world.createCollider(colliderDesc!, body);

        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[id] = content;
        }

        return this.getSimuloObject(body);
    }

    addBall(circle: BaseShapeData & {
        radius: number,
        cakeSlice: boolean,
    }): SimuloObject {
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
            cakeSlice: circle.cakeSlice,
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

        return this.getSimuloObject(body);
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

        return this.getStepInfo(sounds, before);
    }

    getStepInfo(sounds: CollisionSound[], before: number): SimuloPhysicsStepInfo {
        let changed = this.changedContents;
        this.changedContents = {};
        let removed = this.removedContents;
        this.removedContents = [];

        return {
            delta: {
                shapeContent: changed,
                shapeTransforms: this.getShapeTransforms(), // this should be changed to a delta since lots of bodies are sleeping
                removedContents: removed,
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

    getObjectAtPoint(point: { x: number, y: number, z: number }): SimuloObject | null {
        if (!this.world) { throw new Error('init world first'); }
        let vec = new RAPIER.Vector2(point.x, point.y);
        this.world.updateSceneQueries();
        let proj = this.world.projectPoint(vec, true);
        if (proj != null && proj.isInside) {
            return this.getSimuloObject(proj.collider.parent()!);
        }
        return null;
    }

    getSimuloObject(reference: RAPIER.RigidBody): SimuloObject {
        let id = 'unknown';
        try {
            let data = this.getShapeContent(reference.collider(0));
            id = data?.id ?? 'unknown';
        }
        catch (e) { }

        return {
            destroy: () => {
                if (!this.world) { throw new Error('init world first'); }
                this.world.removeRigidBody(reference);
            },
            id,
            reference,
        };
    }

    getObjectsInCuboid(startPoint: { x: number, y: number, z: number }, endPoint: { x: number, y: number, z: number }): SimuloObject[] {
        if (!this.world) { throw new Error('init world first'); }
        let shape = new RAPIER.Cuboid(Math.abs(startPoint.x - endPoint.x) / 2, Math.abs(startPoint.y - endPoint.y) / 2);
        let shapePos = { x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2 };
        this.world.updateSceneQueries();

        let intersecting: Rapier.Collider[] = [];

        this.colliders.forEach((collider) => {
            if (collider.intersectsShape(shape, shapePos, 0)) {
                intersecting.push(collider);
            }
        });

        return intersecting.map((collider) => {
            return this.getSimuloObject(collider.parent()!);
        });
    }

    getObjectsAtPoint(point: {
        x: number,
        y: number,
        z: number,
    }): SimuloObject[] {
        if (!this.world) { throw new Error('init world first'); }
        let vec = new RAPIER.Vector2(point.x, point.y);
        this.world.updateSceneQueries();
        let intersecting: Rapier.Collider[] = [];

        this.colliders.forEach((collider) => {
            if (collider.containsPoint(vec)) {
                intersecting.push(collider);
            }
        });

        return intersecting.map((collider) => {
            return this.getSimuloObject(collider.parent()!);
        });
    }

    destroyCollider(collider: Rapier.Collider) {
        if (!this.world) { throw new Error('init world first'); }
        this.colliders = this.colliders.filter((c) => c != collider);
        let content = this.getShapeContent(collider);
        this.world.removeCollider(collider, true);
        if (content) this.removedContents.push(content.id);
    }

    destroyObject(simuloObject: SimuloObject) {
        if (!this.world) { throw new Error('init world first'); }
        let body = simuloObject.reference;
        if (!(body instanceof RAPIER.RigidBody)) {
            throw new Error('Invalid object');
        }
        let colliderCount = body.numColliders();
        for (let i = 0; i < colliderCount; i++) {
            let collider = body.collider(i);
            this.destroyCollider(collider);
        }
        this.world.removeRigidBody(body);
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

        // todo: use this
        /*         // Compute relative velocity of the anchor points, u
        vec2.subtract(u, bodyB.velocity, bodyA.velocity)
        vec2.crossZV(tmp, bodyB.angularVelocity, rj)
        vec2.add(u, u, tmp)
        vec2.crossZV(tmp, bodyA.angularVelocity, ri)
        vec2.subtract(u, u, tmp)

        // F = - k * ( x - L ) - D * ( u )
        vec2.scale(f, r_unit, -k * (rlen - l) - d * vec2.dot(u, r_unit)) */

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

    slicePolygon(collider: Rapier.Collider, line: number[][]) {
        let shape = collider.shape as Rapier.ConvexPolygon;
        let points: Float32Array = shape.vertices;
        let pointsArray: [x: number, y: number][] = [];
        for (let i = 0; i < points.length; i += 2) {
            pointsArray.push([points[i], points[i + 1]]);
        }
        let newPoints = polygonSplitter({
            type: "Polygon",
            coordinates: pointsArray
        }, {
            type: "LineString",
            coordinates: line,
        });
        console.log('OMG POINTSER:', newPoints);
    }

    getObjectByID(id: string): SimuloObject | null {
        if (!this.world) { throw new Error('init world first'); }
        let bodies = this.world.bodies.getAll();
        let body = bodies.find((body) => {
            let userData = body.userData as SimuloObjectData;
            return userData.id === id;
        });

        if (body) {
            let simuloObject: SimuloObject = {
                destroy: () => {
                    this.world?.removeRigidBody(body!);
                },
                id: id,
                reference: body,
            };
        }
        return null;
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
                bodyA = this.getObjectByID(spring.bodyA)?.reference;
            }
            if (spring.bodyB) {
                bodyB = this.getObjectByID(spring.bodyB)?.reference;
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
                getBodyAAngularVelocity: () => {
                    if (bodyA == null) return 0;
                    return bodyA.angvel();
                },
                getBodyBAngularVelocity: () => {
                    if (bodyB == null) return 0;
                    return bodyB.angvel();
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
    getObjectData(object: SimuloObject): SimuloObjectData | null {
        if (!this.world) { throw new Error('init world first'); }
        let body = object.reference;
        if (!(body instanceof RAPIER.RigidBody)) {
            throw new Error('Invalid object');
        }
        return body.userData as SimuloObjectData;
    }
    removeSpring(spring: any): void {
        delete this.springs[spring.id];
    }
}

export default SimuloPhysicsServerRapier;
export type { ShapeContentData, Polygon, Cuboid, Ball, ShapeTransformData, SimuloPhysicsStepInfo, SimuloSpring };