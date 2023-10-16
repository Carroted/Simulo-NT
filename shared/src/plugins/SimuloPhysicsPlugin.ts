import type SimuloServerPlugin from "../SimuloServerPlugin";
import type SimuloServerController from "../SimuloServerController";
import SimuloPhysicsServerRapier from "../SimuloPhysicsServerRapier";
import type SimuloPhysicsStepInfo from "../SimuloPhysicsStepInfo";
import type SimuloPhysicsServer from "../SimuloPhysicsServer";
import SimuloPhysicsServerP2 from "../SimuloPhysicsServerP2";

/** SimuloPhysicsServerRapier as a plugin, which is a rapier physics wrapper that also adds springs */

export default class SimuloPhysicsPlugin implements SimuloServerPlugin {
    name = "Simulo Physics Plugin";
    description = "Rapier physics for Simulo. This can change physics backends.";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-physics-plugin";
    dependencies = [];
    controller: SimuloServerController;
    physicsServer: SimuloPhysicsServer;
    previousStepInfo: SimuloPhysicsStepInfo | null = null;
    paused = false;

    constructor(controller: SimuloServerController, backend: "rapier" | "p2") {
        this.controller = controller;
        if (backend === "rapier") {
            this.physicsServer = new SimuloPhysicsServerRapier();
        }
        else if (backend === "p2") {
            this.physicsServer = new SimuloPhysicsServerP2();
        }
        else {
            console.log('No physics backend specified, defaulting to rapier'); // its better to default to an engine than to throw error since that would crash the entire server
            this.physicsServer = new SimuloPhysicsServerRapier();
        }
    }

    async switchBackends(backend: "rapier" | "p2") {
        this.physicsServer.destroy();

        if (backend === "rapier") {
            this.physicsServer = new SimuloPhysicsServerRapier();
        } else if (backend === "p2") {
            this.physicsServer = new SimuloPhysicsServerP2();
        }
        await this.init();
    }

    async init() {
        if (this.physicsServer instanceof SimuloPhysicsServerRapier) {
            await this.physicsServer.init();
        }
        let groundPlane = this.physicsServer.addCuboid({
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
            restitution: 0.3,
            density: 1,
        });

        let addBox = (x: number, y: number) => {
            this.physicsServer.addCuboid({
                width: 1, height: 1, depth: 1,
                color: 0xff5050,
                alpha: 1,
                border: 0xff0000,
                name: 'joe',
                sound: '/assets/sounds/impact.wav',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
                position: { x: x, y: y },
                isStatic: false,
                friction: 0,
                restitution: 1,
                density: 10,
            });
        };
        let doIt = (x: number, color: number) => {
            this.addPerson([x, 10], color);
            addBox(x + 0.1, 2);
            this.physicsServer.addCuboid({
                width: 2, height: 8, depth: 1,
                color: 0xffa0a0,
                alpha: 1,
                border: null,
                name: 'joe',
                sound: '/assets/sounds/impact.wav',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
                position: { x: x + 2, y: -6 },
                isStatic: true,
                friction: 0.5,
                restitution: 0,
                density: 1,
            });
            this.physicsServer.addCuboid({
                width: 2, height: 8, depth: 1,
                color: 0xffa0a0,
                alpha: 1,
                border: null,
                name: 'joe',
                sound: '/assets/sounds/impact.wav',
                borderWidth: 1,
                borderScaleWithZoom: true,
                image: null,
                zDepth: 0,
                position: { x: x - 10, y: -6 },
                isStatic: true,
                friction: 0.5,
                restitution: 0,
                density: 1,
            });
        };
        doIt(-40, 0x99e077);
        doIt(40, 0xff8045);
        doIt(0, 0x6380ff);


        let createTestbed = (offsetX: number, offsetY: number, size: number, cubeFriction: number = 0.5, density: number = 1) => {
            {
                // Create Ground.
                let groundSize = 40.0;
                let grounds = [
                    { x: 0.0, y: 0.0, hx: groundSize, hy: 0.1 },
                    { x: -groundSize, y: groundSize, hx: 0.1, hy: groundSize },
                    { x: groundSize, y: groundSize, hx: 0.1, hy: groundSize },
                ];

                grounds.forEach((ground) => {
                    this.physicsServer.addCuboid({
                        width: ground.hx * 2 * size, height: ground.hy * 2 * size, depth: 1,
                        color: 0xf3d9b1,
                        alpha: 1,
                        border: null,
                        name: 'joe',
                        sound: '/assets/sounds/impact.wav',
                        borderWidth: 1,
                        borderScaleWithZoom: true,
                        image: null,
                        zDepth: 0,
                        position: { x: (ground.x * size) + offsetX, y: (ground.y * size) + offsetY },
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

                let colors = [0x98c1d9, 0x053c5e, 0x1f7a8c];
                let colorIndex = 0;

                for (j = 0; j < numy; ++j) {
                    for (i = 0; i < num; ++i) {
                        let x = i * shift - centerx;
                        let y = j * shift + centery + 3.0;

                        this.physicsServer.addCuboid({
                            width: rad * 2 * size, height: rad * 2 * size, depth: 1,
                            color: colors[colorIndex],
                            alpha: 1,
                            border: null,
                            name: 'joe',
                            sound: '/assets/sounds/impact.wav',
                            borderWidth: 1,
                            borderScaleWithZoom: true,
                            image: null,
                            zDepth: 0,
                            position: { x: (x * size) + offsetX, y: (y * size) + offsetY },
                            isStatic: false,
                            friction: cubeFriction,
                            restitution: 0,
                            density: density,
                        });

                        colorIndex = (colorIndex + 1) % colors.length;
                    }
                }
            }
        };
    }
    start(): void {
        console.log("start");
    }
    addPerson(offset: [x: number, y: number], color: number, personScale = 0.4) {
        let personBodyPoints: [x: number, y: number][] = [
            [0.0, 0.64],
            [0.712, 0.499],
            [1.19, 0.172],
            [1.504, -0.27],
            [1.67, -0.779],
            [1.678, -3.272],
            [1.643, -3.469],
            [1.451, -3.597],
            [-1.416, -3.589],
            [-1.582, -3.51],
            [-1.654, -3.35],
            [-1.67, -0.779],
            [-1.497, -0.305],
            [-1.231, 0.126],
            [-0.65, 0.517],
            [-0.328, 0.614],
        ];

        personBodyPoints = personBodyPoints.map(function (point) {
            return [point[0] * personScale, point[1] * personScale];
        });

        let body = this.physicsServer.addPolygon({
            points: personBodyPoints.map(point => { return { x: point[0], y: point[1] } }),
            position: { x: offset[0], y: offset[1] },
            alpha: 1,
            name: "Polygon",
            border: null,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: "/assets/sounds/impact.wav",
            zDepth: 0,
            isStatic: false,
            density: 1,
            friction: 0.5,
            restitution: 0,
            color: color,
        });

        let head = this.physicsServer.addBall({
            radius: 1.71 * personScale,
            position: { x: offset[0], y: offset[1] + (1.88 * personScale) },
            alpha: 1,
            name: "some kind of Object",
            border: null,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: "/assets/sounds/impact.wav",
            zDepth: 0,
            isStatic: false,
            density: 1,
            friction: 0.5,
            restitution: 0,
            color: color,
            cakeSlice: true,
        });

        let axle = this.physicsServer.addAxle({
            localAnchorA: { x: 0, y: (0.32 * personScale), z: 0 },
            localAnchorB: { x: 0, y: ((1.88 - 0.32) * -personScale), z: 0 },
            bodyA: body,
            bodyB: head
        });

        let spring = this.physicsServer.addSpring({
            localAnchorA: { x: 0, y: (3.26 * personScale), z: 0 },
            localAnchorB: { x: 0, y: ((1.88 - 3.26) * -personScale), z: 0 },
            objectA: body,
            objectB: head,
            stiffness: 0.6 * personScale,
            restLength: 0.005 * personScale,
            damping: 0.01
        });
    }
    update(): void {
        if (this.paused) {
            // we dont want to step the world, but the world can still change if the players add stuff.
            // so, we must render the world again with updated step info
            let stepInfo = this.physicsServer.getStepInfo([], new Date().getTime()); // get updated world state, no collision sounds, and before is set to right now
            this.previousStepInfo = stepInfo;
            return;
        }

        let stepInfo = this.physicsServer.step();
        // physics plugin doesnt directly emit data, instead it should be before other plugins in execution order
        // plugins can then use previousStepInfo to get physics data, and send all data in one packet
        this.previousStepInfo = stepInfo;
    }
    destroy(): void {
        console.log("destroy");
    }
    handleIncomingEvent(event: string, data: any, id: string): void { }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}