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

    cachedImages: { [url: string]: any } = {}; // can store string for svg for example, or something else for rasters

    async fetchSVG(url: string) {
        if (this.cachedImages[url]) return this.cachedImages[url];
        this.cachedImages[url] = await (await fetch(url)).text();
        return this.cachedImages[url];
    }

    /** Generate a recolored SVG cursor and apply it on the document body. */
    async setColorCursor(image: string, fillColor: string, borderColor?: string) { // in the future, we will have way more kinds of cursors. anyone will be able to create a recolorable cursor
        // the cursor is an svg with some colors to replace to create a custom cursor

        // fetch the svg
        let cursorSVG = await this.fetchSVG(image);

        // if you open that texture you'll see that it's in red and blue
        // by replacing the colors we can change the cursor colors to anything at runtime
        cursorSVG = cursorSVG.replace(/#ff0000/g, fillColor);
        if (!borderColor) {
            cursorSVG = cursorSVG.replace(/#0000ff/g, fillColor === '#000000' ? '#ffffff' : '#000000');
        }
        else {
            cursorSVG = cursorSVG.replace(/#0000ff/g, borderColor);
        }

        // create a data url from the svg
        let cursorDataURL = 'data:image/svg+xml;base64,' + btoa(cursorSVG);

        // set body cursor
        document.body.style.cursor = `url("${cursorDataURL}") 8 3, auto`;
    }

    constructor(controller: SimuloClientController) {
        this.controller = controller;
        this.viewer = new SimuloViewerPIXI();

        // listen to viewer events and emit them to the server in Physics Sandbox format

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

        this.setColorCursor('./assets/textures/cursor_new.svg', '#000000');
    }

    destroy(): void { } // for now, nothing in destroy. in the future, this should properly dispose of everything cleanly

    handleIncomingEvent(event: string, data: any): void {
        if (event === 'physics_step') {
            // the world has updated, let's update the viewer with the new data
            let stepInfo = data as SimuloPhysicsStepInfo;
            this.viewer.update(stepInfo);
        }
    }
    handleOutgoingEvent(event: string, data: any): void { } // nothing here
}