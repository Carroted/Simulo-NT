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

    async init() {
        await RAPIER.init();
        let gravity = new RAPIER.Vector2(0.0, -9.81);
        let world = new RAPIER.World(gravity);
        this.world = world;
        //this.graphics = new Graphics();




        // Create Ground.
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
        }

        /*this.mouse = { x: 0, y: 0 };

        window.addEventListener("mousemove", (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = 1 - (event.clientY / window.innerHeight) * 2;
        });

        this.graphics.viewport.moveCenter(-100.0, -300.0);*/
    }

    constructor() {

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
        let colliderDesc = RAPIER.ColliderDesc.cuboid(width, height);
        let coll = this.world.createCollider(colliderDesc!, body);
        //this.graphics.addCollider(RAPIER, this.world, coll);
        this.colliders.push(coll);
        let content = this.getShapeContent(coll);
        if (content) {
            this.changedContents[data.id] = content;
        }
    }

    step(): SimuloPhysicsStepInfo {
        if (!this.world) { throw new Error('init world first'); }

        this.world.maxVelocityIterations = 4;
        this.world.maxVelocityFrictionIterations =
            4 * 2;

        let before = new Date().getTime();
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
        };
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
}

export default SimuloPhysicsServerRapier;
export type { ShapeContentData, Polygon, Rectangle, Circle, ShapeTransformData, SimuloPhysicsStepInfo };