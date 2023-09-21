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

    async generateCursor(color: string) {
        // ok so basically
        // the cursor is an svg with some colors to replace to create a custom cursor
        let cursorSVG = await (await fetch('./assets/textures/cursor_new.svg')).text();
        cursorSVG = cursorSVG.replace(/#ff0000/g, color);
        cursorSVG = cursorSVG.replace(/#0000ff/g, color === '#000000' ? '#ffffff' : '#000000');
        // create a data url from the svg
        let cursorDataURL = 'data:image/svg+xml;base64,' + btoa(cursorSVG);
        // set body cursor
        document.body.style.cursor = `url("${cursorDataURL}") 8 3, auto`;
    }

    constructor(controller: SimuloClientController) {
        this.controller = controller;
        this.viewer = new SimuloViewerPIXI();

        this.viewer.on('pointerdown', (e: { point: { x: number, y: number }, event: any }) => {
            if (e.event.button === 0) {
                this.controller.emit('player_down', e.point);
            }
        });
        this.viewer.on('pointermove', (e: { point: { x: number, y: number }, event: any }) => {
            this.controller.emit('player_move', e.point);
        });
        this.viewer.on('pointerup', (e: { point: { x: number, y: number }, event: any }) => {
            if (e.event.button === 0) {
                this.controller.emit('player_up', e.point);
            }
        });

        let renderLoop = () => {
            this.viewer.render();
            requestAnimationFrame(renderLoop);
        }
        requestAnimationFrame(renderLoop);

        this.generateCursor('#000000');
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