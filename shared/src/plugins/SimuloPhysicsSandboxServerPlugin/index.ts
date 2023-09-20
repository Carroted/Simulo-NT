import type SimuloServerPlugin from "../../SimuloServerPlugin";
import type SimuloServerController from "../../SimuloServerController";
import type SimuloPhysicsPlugin from "../SimuloPhysicsPlugin";
import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";

export default class SimuloPhysicsSandboxServerPlugin implements SimuloServerPlugin {
    name = "Simulo Physics Sandbox Server Plugin";
    description = "Simple physics sandbox for Simulo in multiplayer, with tools to create and interact with the world.";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-physics-sandbox-server-plugin";
    dependencies = ['@carroted/simulo-physics-plugin'];

    controller: SimuloServerController;
    physicsPlugin: SimuloPhysicsPlugin;
    players: { [id: string]: PhysicsSandboxPlayer } = {};

    constructor(controller: SimuloServerController, physicsPlugin: SimuloPhysicsPlugin) {
        this.controller = controller;
        this.physicsPlugin = physicsPlugin;
    }
    start(): void { }
    update(): void {
        // emit the the physics previousStep
        if (this.physicsPlugin.previousStepInfo) {
            this.controller.emit('physics_step', this.physicsPlugin.previousStepInfo, null);
        }
    }
    destroy(): void { }
    handleIncomingEvent(event: string, data: any, id: string): void {
        // here we handle incoming events from clients
        if (!this.players[id]) {
            this.players[id] = {
                x: 0,
                y: 0,
                color: 0xffffff,
                id
            }
        }

        // player event handlers
        if (this.players[id]) {
            // player_move is usually triggered by mouse movement, but can also be triggered by keyboard movement
            if (event === 'player_move') {
                // with nullish coalescing operator we dont need to check if data.x and data.y are defined
                this.players[id].x = data.x ?? 0;
                this.players[id].y = data.y ?? 0;
            }

            // player_down fires when primary input is pressed, such as mouse left click
            if (event === 'player_down') {
                // i forgoy
                console.log('down received')
                this.physicsPlugin.physicsServer.addRectangle(1, 1, {
                    id: "bo2e2x" + Math.random(),
                    color: 0xffffff,
                    border: 0xffffff,
                    name: 'joe',
                    sound: 'test',
                    borderWidth: 1,
                    borderScaleWithZoom: true,
                    image: null,
                    zDepth: 0,
                }, [data.x, data.y], false);
            }

            // player_up fires when primary input is released, such as mouse left click
            if (event === 'player_up') {
                // i forgoy
            }
        }
    }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}