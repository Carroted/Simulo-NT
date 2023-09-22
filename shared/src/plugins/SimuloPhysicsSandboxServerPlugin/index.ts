import type SimuloServerPlugin from "../../SimuloServerPlugin";
import type SimuloServerController from "../../SimuloServerController";
import type SimuloPhysicsPlugin from "../SimuloPhysicsPlugin";
import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";
import PhysicsSandboxTool from "./PhysicsSandboxTool";

import DragTool from "./tools/DragTool";
import CubesTool from "./tools/CubesTool";

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

    builtInTools: { [id: string]: PhysicsSandboxTool } = {
        "drag": new DragTool(this),
        "cubes": new CubesTool(this)
    };

    getTools(): {
        name: string,
        icon: string,
        description: string,
        id: string
    }[] {
        return Object.keys(this.builtInTools).map((id) => {
            let tool = this.builtInTools[id];
            return {
                name: tool.name,
                icon: tool.icon,
                description: tool.description,
                id
            }
        });
    }

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
        // fire tool update events for all players
        Object.keys(this.players).forEach(playerId => {
            if (this.builtInTools[this.players[playerId].tool]) {
                this.builtInTools[this.players[playerId].tool].update(this.players[playerId]);
            }
        });
    }
    destroy(): void { }
    handleIncomingEvent(event: string, data: any, id: string): void {
        // here we handle incoming events from clients
        if (!this.players[id]) {
            this.players[id] = {
                x: 0,
                y: 0,
                color: 0xffffff,
                id,
                down: false,
                tool: "drag"
            }
        }

        // player event handlers
        if (this.players[id]) {
            if (event === 'player_move' || event === 'player_down' || event === 'player_up') {
                this.players[id].x = data.x ?? 0;
                this.players[id].y = data.y ?? 0;
            }

            // player_move is usually triggered by mouse movement, but can also be triggered by keyboard movement
            if (event === 'player_move') {
                if (this.builtInTools[this.players[id].tool]) {
                    this.builtInTools[this.players[id].tool].playerMove(this.players[id]);
                }
            }

            // player_down fires when primary input is pressed, such as mouse left click
            if (event === 'player_down') {
                this.players[id].down = true;
                if (this.builtInTools[this.players[id].tool]) {
                    this.builtInTools[this.players[id].tool].playerDown(this.players[id]);
                }
            }

            // player_up fires when primary input is released, such as mouse left click
            if (event === 'player_up') {
                this.players[id].down = false;
                if (this.builtInTools[this.players[id].tool]) {
                    this.builtInTools[this.players[id].tool].playerUp(this.players[id]);
                }
            }

            if (event === 'player_tool') {
                this.players[id].tool = data.toString();
                console.log('changed tool to', data);
                this.controller.emit('player_tool_success', data, id);
            }
        }
    }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}