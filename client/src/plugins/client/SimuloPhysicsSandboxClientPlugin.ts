import type SimuloClientPlugin from "../../SimuloClientPlugin";
import type SimuloClientController from "../../SimuloClientController";
import type PhysicsSandboxPlayer from "../../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/PhysicsSandboxPlayer";
import SimuloViewerPIXI from "../../SimuloViewerPIXI";
import type { SimuloPhysicsStepInfo } from "../../../../shared/src/SimuloPhysicsServerRapier";

/** This will manage tools and UI for Physics Sandbox client-side */

export default class SimuloPhysicsSandboxClientPlugin implements SimuloClientPlugin {
    name = "Simulo Physics Sandbox Client Plugin";
    description = "The client-side plugin for the Physics Sandbox game";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-physics-sandbox-client-plugin";
    dependencies = [];
    controller: SimuloClientController;
    viewer: SimuloViewerPIXI;

    constructor(controller: SimuloClientController) {
        this.controller = controller;
        this.viewer = new SimuloViewerPIXI();
        this.viewer.on('pointerdown', (e) => {
            // at clientx and y, emit a player_down event
            console.log('down at ' + e.globalX + ', ' + e.globalY)
            let global = this.viewer.viewport.toWorld(e.globalX, e.globalY);
            this.controller.emit('player_down', { x: global.x, y: -global.y });
        });
        this.viewer.on('pointermove', (e) => {
            // at clientx and y, emit a player_move event
            let global = this.viewer.viewport.toWorld(e.globalX, e.globalY);
            this.controller.emit('player_move', { x: global.x, y: -global.y });
        });
        let renderLoop = () => {
            this.viewer.render();
            requestAnimationFrame(renderLoop);
        }
        requestAnimationFrame(renderLoop);
    }

    destroy(): void { }
    handleIncomingEvent(event: string, data: any): void {
        if (event === 'physics_step') {
            // we get the physics step info from the server
            let stepInfo = data as SimuloPhysicsStepInfo;
            //console.log(stepInfo.delta.shapeTransforms);
            // we can use this to update the viewer
            this.viewer.update(stepInfo);
        }
    }
    handleOutgoingEvent(event: string, data: any): void { } // nothing here
}