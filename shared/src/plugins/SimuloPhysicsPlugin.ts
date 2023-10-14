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
                this.physicsServer.addCuboid({
                    width: ground.hx * 2, height: ground.hy * 2, depth: 1,
                    color: 0xf3d9b1,
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

            let colors = [0x98c1d9, 0x053c5e, 0x1f7a8c];
            let colorIndex = 0;

            for (j = 0; j < numy; ++j) {
                for (i = 0; i < num; ++i) {
                    let x = i * shift - centerx;
                    let y = j * shift + centery + 3.0;

                    this.physicsServer.addCuboid({
                        width: rad * 2, height: rad * 2, depth: 1,
                        color: colors[colorIndex],
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

                    colorIndex = (colorIndex + 1) % colors.length;
                }
            }
        }
    }
    start(): void {
        console.log("start");
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