import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import type { Circle, Polygon, Rectangle, ShapeContentData, ShapeTransformData, SimuloPhysicsStepInfo } from "../../../shared/src/SimuloPhysicsServerRapier";

export default class SimuloViewerPIXI {
    coll2gfx: Map<string, PIXI.Graphics>;
    renderer: PIXI.Renderer;
    scene: PIXI.Container;
    viewport: Viewport;
    listeners: { [event: string]: ((data: any) => void)[] } = {};
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) return;
        this.listeners[event].splice(this.listeners[event].indexOf(callback), 1);
    }

    constructor() {
        // High pixel Ratio make the rendering extremely slow, so we cap it.
        // const pixelRatio = window.devicePixelRatio ? Math.min(window.devicePixelRatio, 1.5) : 1;

        this.coll2gfx = new Map();
        this.renderer = new PIXI.Renderer({
            backgroundAlpha: 0,
            antialias: true,
            // resolution: pixelRatio,
            width: window.innerWidth,
            height: window.innerHeight,
        });

        this.scene = new PIXI.Container();
        // add to document
        document.body.appendChild(this.renderer.view as HTMLCanvasElement);

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            //interaction: this.renderer.plugins.interaction,
            events: this.renderer.events
        });

        this.scene.addChild(this.viewport as any);
        this.viewport.drag().pinch().wheel().decelerate();
        this.viewport.on("pointermove", (e) => {
            if (this.listeners["pointermove"]) this.listeners["pointermove"].forEach((callback) => callback(e));
        });
        this.viewport.on("pointerdown", (e) => {
            if (this.listeners["pointerdown"]) this.listeners["pointerdown"].forEach((callback) => callback(e));
        });
        this.viewport.on("pointerup", (e) => {
            if (this.listeners["pointerup"]) this.listeners["pointerup"].forEach((callback) => callback(e));
        });

        let me = this;

        function onWindowResize() {
            me.renderer.resize(window.innerWidth, window.innerHeight);
        }

        function onContextMenu(event: UIEvent) {
            event.preventDefault();
        }

        document.oncontextmenu = onContextMenu;
        document.body.oncontextmenu = onContextMenu;

        window.addEventListener("resize", onWindowResize, false);

        this.lookAt({
            target: { x: -10.0, y: -30.0 },
            zoom: 7.0,
        });
    }

    update(stepInfo: SimuloPhysicsStepInfo) {
        for (let key in stepInfo.delta.shapeContent) {
            let content = stepInfo.delta.shapeContent[key];
            this.addShape(content);
        }
        this.updatePositions(stepInfo.delta.shapeTransforms);
    }

    render() {
        this.renderer.render(this.scene);

    }

    lookAt(pos: { zoom: number; target: { x: number; y: number } }) {
        this.viewport.setZoom(pos.zoom);
        this.viewport.moveCenter(pos.target.x, pos.target.y);
    }

    updatePositions(transformData: { [id: string]: ShapeTransformData }) {
        Object.keys(transformData).forEach((id) => {
            /*let gfx = this.coll2gfx.get(elt.handle);
            let translation = elt.translation();
            let rotation = elt.rotation();

            if (!!gfx) {
                gfx.position.x = translation.x;
                gfx.position.y = -translation.y;
                gfx.rotation = -rotation;
            }*/

            let gfx = this.coll2gfx.get(id);
            let data = transformData[id];
            let position = { x: data.x, y: data.y };
            let angle = data.angle;

            if (!!gfx) {
                gfx.position.x = position.x;
                gfx.position.y = -position.y;
                gfx.rotation = -angle;
            }
        });
    }

    reset() {
        this.coll2gfx.forEach((gfx) => {
            this.viewport.removeChild(gfx);
            gfx.destroy();
        });
        this.coll2gfx = new Map();
    }

    addShape(content: ShapeContentData) {
        let gfx = new PIXI.Graphics();
        switch (content.type) {
            case "rectangle":
                let rectangle = content as Rectangle;
                /*gfx.scale.x = rectangle.width;
                gfx.scale.y = rectangle.height;
                gfx.beginFill(rectangle.color, 0xff);
                gfx.drawRect(-1, 1, 2, -2);
                gfx.endFill();*/
                // polygon instead
                gfx.beginFill(rectangle.color);
                gfx.moveTo(-rectangle.width / 2, rectangle.height / 2);
                gfx.lineTo(rectangle.width / 2, rectangle.height / 2);
                gfx.lineTo(rectangle.width / 2, -rectangle.height / 2);
                gfx.lineTo(-rectangle.width / 2, -rectangle.height / 2);
                gfx.lineTo(-rectangle.width / 2, rectangle.height / 2);
                gfx.endFill();
                break;
            case "circle":
                let circle = content as Circle;
                gfx.scale.x = circle.radius;
                gfx.scale.y = circle.radius;
                gfx.beginFill(circle.color);
                gfx.drawCircle(0, 0, 1);
                gfx.endFill();
                break;
            case "polygon":
                let polygon = content as Polygon;
                gfx.beginFill(polygon.color);
                gfx.moveTo(polygon.points[0][0], -polygon.points[0][1]);
                /*                 for (i = 2; i < vertices.length; i += 2) {
                    graphics.lineTo(vertices[i], -vertices[i + 1]);
                } */ // same logic but with our data structure
                for (let i = 1; i < polygon.points.length; i++) {
                    gfx.lineTo(polygon.points[i][0], -polygon.points[i][1]);
                }
                gfx.lineTo(polygon.points[0][0], -polygon.points[0][1]);
                gfx.endFill();
                break;
            default:
                console.error("Unknown shape type: " + content.type);
                break;
        }

        console.log('registered shape')

        this.coll2gfx.set(content.id, gfx);
        this.viewport.addChild(gfx);
    }
}