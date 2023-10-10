import type SimuloServerPlugin from "../../SimuloServerPlugin";
import type SimuloServerController from "../../SimuloServerController";
import type SimuloPhysicsPlugin from "../SimuloPhysicsPlugin";
import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";
import PhysicsSandboxTool from "./PhysicsSandboxTool";

import DragTool from "./tools/DragTool";
import type { SimuloPhysicsStepInfo } from "../../SimuloPhysicsServerRapier";

import type WorldUpdate from "./WorldUpdate";
import type OverlayShape from "./OverlayShape";
import type OverlayText from "./OverlayText";
import RectangleTool from "./tools/RectangleTool";
import CircleTool from "./tools/CircleTool";
import SimuloPhysicsServerRapier from "../../SimuloPhysicsServerRapier";
import SpringTool from "./tools/SpringTool";
import SelectMoveTool from "./tools/SelectMoveTool";
import PhysicsSandboxPlayerExtended from "./PhysicsSandboxPlayerExtended";

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
    players: { [id: string]: PhysicsSandboxPlayerExtended } = {};

    builtInTools: { [id: string]: PhysicsSandboxTool } = {
        "select_move": new SelectMoveTool(this),
        "drag": new DragTool(this),
        "rectangle": new RectangleTool(this),
        "circle": new CircleTool(this),
        "spring": new SpringTool(this)
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

    /** Overlays are cleared each frame, and sent alongside each `world_update`. */
    overlayShapes: OverlayShape[] = [];
    /** Overlays are cleared each frame, and sent alongside each `world_update`. */
    overlayTexts: OverlayText[] = [];

    /** Physics Sandbox supports server-side rendering overlays each frame. This can be used for tools.
     * 
     * If you want to use this, you should call this function each frame with the shapes you want to render, since we clear the overlays each frame.
     * 
     * For instance, while drawing a rectangle, we can show a preview of what it'll look like on the client, with dimensions and color.
     * 
     * Overlays are sent alongside each `world_update` event. */
    addOverlayShape(shape: OverlayShape): number {
        let length = this.overlayShapes.push(shape);
        // return index of shape
        return length - 1;
    }

    /** Physics Sandbox supports server-side rendering overlays each frame. This can be used for tools.
     * 
     * If you want to use this, you should call this function each frame with the texts you want to render, since we clear the overlays each frame.
     * 
     * For instance, when dragging an object, we can show the drag force.
     * 
     * Overlays are sent alongside each `world_update` event. */
    addOverlayText(text: OverlayText) {
        let length = this.overlayTexts.push(text);
        // return index of text
        return length - 1;
    }

    removeOverlayShape(index: number) {
        this.overlayShapes.splice(index, 1);
    }

    removeOverlayText(index: number) {
        this.overlayTexts.splice(index, 1);
    }

    constructor(controller: SimuloServerController, physicsPlugin: SimuloPhysicsPlugin) {
        this.controller = controller;
        this.physicsPlugin = physicsPlugin;
    }
    start(): void { }
    update(): void {
        // emit the the physics previousStep
        if (this.physicsPlugin.previousStepInfo) {
            this.controller.emit('world_update', {
                ...this.physicsPlugin.previousStepInfo,
                overlays: {
                    shapes: this.overlayShapes,
                    texts: this.overlayTexts
                }
            } as WorldUpdate, null);
        }
        // clear overlays
        this.overlayShapes = [];
        this.overlayTexts = [];
        // fire tool update events for all players
        Object.keys(this.players).forEach(playerId => {
            if (this.builtInTools[this.players[playerId].tool]) {
                this.builtInTools[this.players[playerId].tool].update(this.players[playerId]);
            }
        });
    }
    destroy(): void { }
    async handleIncomingEvent(event: string, data: any, id: string) {
        // here we handle incoming events from clients
        if (!this.players[id]) {
            this.players[id] = {
                x: 0,
                y: 0,
                color: 0xffffff,
                id,
                down: false,
                tool: "drag",
                selectedObjects: []
            }
        }

        // player event handlers
        if (this.players[id]) {
            if (event === 'player_move' || event === 'player_down' || event === 'player_up') {
                this.players[id].x = data.x ?? 0;
                this.players[id].y = data.y ?? 0;
            }

            // player_down fires when primary input is pressed, such as mouse left click
            if (event === 'player_down') {
                this.players[id].down = true;
                if (this.builtInTools[this.players[id].tool]) {
                    this.builtInTools[this.players[id].tool].playerDown(this.players[id]);
                }
            }

            // player_move is usually triggered by mouse movement, but can also be triggered by keyboard movement
            if (event === 'player_move') {
                if (this.builtInTools[this.players[id].tool]) {
                    this.builtInTools[this.players[id].tool].playerMove(this.players[id]);
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

            if (event === 'player_delete_selection') {
                this.players[id].selectedObjects.forEach((collider) => {
                    this.physicsPlugin.physicsServer.destroyCollider(collider);
                    console.log('collider gone');
                });
                console.log('removed selection');
                this.players[id].selectedObjects = [];
            }
        }

        if (event === 'save') {
            localStorage.setItem('what the fu', JSON.stringify(this.physicsPlugin.physicsServer.saveScene()));
        }

        if (event === 'load') {
            this.physicsPlugin.physicsServer.world = null;
            this.physicsPlugin.physicsServer = new SimuloPhysicsServerRapier();
            await this.physicsPlugin.physicsServer.initFromSaved(JSON.parse(localStorage.getItem('what the fu')!));
        }

        if (event === 'set_paused') {
            this.physicsPlugin.paused = data ? true : false; // force it to be a boolean, because why not
            this.controller.emit('pause_changed', this.physicsPlugin.paused, null);
        }
    }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}
