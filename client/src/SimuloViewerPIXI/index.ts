import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import type { Circle, Polygon, Rectangle, ShapeContentData, ShapeTransformData, SimuloPhysicsStepInfo } from "../../../shared/src/SimuloPhysicsServerRapier";

PIXI.curves.adaptive = false;

/** Renderer in PIXI.js for Simulo. You can add shapes with `addShape`, and update their positions with `update`. */

export default class SimuloViewerPIXI {
    coll2gfx: Map<string, PIXI.Graphics>;
    renderer: PIXI.Renderer;
    scene: PIXI.Container;
    viewport: Viewport;
    canvas: HTMLCanvasElement;

    /** Can pan the camera with keys like HJKL, or, for mere mortals, arrow keys */
    panInputs: {
        up: boolean;
        left: boolean;
        down: boolean;
        right: boolean;
    } = {
            up: false,
            left: false,
            down: false,
            right: false,
        };

    listeners: { [event: string]: ((data: any) => void)[] } = {};
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) return;
        this.listeners[event].splice(this.listeners[event].indexOf(callback), 1);
    }

    /** Previous mouse position from `e.globalX` and `Y`, not world space */
    previousMousePos: { x: number, y: number } = { x: 0, y: 0 };

    updateMouse(eventName: string, position?: { x: number, y: number }, e?: MouseEvent) {
        if (position) {
            this.previousMousePos = { x: position.x, y: position.y }; // clone, not reference
            if (this.listeners[eventName]) {
                let point = this.viewport.toWorld(position.x, position.y);
                this.listeners[eventName].forEach((callback) => callback({
                    event: e ?? null,
                    point: { x: point.x, y: -point.y },
                }));
            }
        }
        else {
            if (this.listeners[eventName]) {
                // use previous mouse position
                let point = this.viewport.toWorld(this.previousMousePos.x, this.previousMousePos.y);
                this.listeners[eventName].forEach((callback) => callback({
                    event: e ?? null,
                    point: { x: point.x, y: -point.y },
                }));
            }
        }
    }

    constructor() {
        // high pixel ratio makes the rendering extremely slow, so we cap it
        const pixelRatio = window.devicePixelRatio ? Math.min(window.devicePixelRatio, 1.5) : 1;

        this.coll2gfx = new Map();
        this.renderer = new PIXI.Renderer({
            backgroundAlpha: 0,
            antialias: true,
            resolution: pixelRatio,
            width: window.innerWidth,
            height: window.innerHeight,
        });

        this.scene = new PIXI.Container();

        // add to document
        this.canvas = document.body.appendChild(this.renderer.view as HTMLCanvasElement);

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            events: this.renderer.events,
        });

        this.scene.addChild(this.viewport as any);
        this.viewport.drag({
            mouseButtons: "middle-right", // left click is used for tools
        }).pinch().wheel().decelerate();

        this.viewport.on("pointermove", (e) => {
            this.updateMouse("pointermove", { x: e.globalX, y: e.globalY }, e);
        });
        this.viewport.on("pointerdown", (e) => {
            this.updateMouse("pointerdown", { x: e.globalX, y: e.globalY }, e);
        });
        this.viewport.on("pointerup", (e) => {
            this.updateMouse("pointerup", { x: e.globalX, y: e.globalY }, e);
        });

        this.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'h') {
                this.panInputs.left = true;
            }
            if (e.key === 'j') {
                this.panInputs.down = true;
            }
            if (e.key === 'k') {
                this.panInputs.up = true;
            }
            if (e.key === 'l') {
                this.panInputs.right = true;
            }
        });

        this.canvas.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.key === 'h') {
                this.panInputs.left = false;
            }
            if (e.key === 'j') {
                this.panInputs.down = false;
            }
            if (e.key === 'k') {
                this.panInputs.up = false;
            }
            if (e.key === 'l') {
                this.panInputs.right = false;
            }
        });

        setInterval(() => {
            let x = 0;
            let y = 0;
            let speed = 2 / this.viewport.scale.y;
            if (this.panInputs.left) {
                x = -1;
            }
            if (this.panInputs.down) {
                y = 1;
            }
            if (this.panInputs.up) {
                y = -1;
            }
            if (this.panInputs.right) {
                x = 1;
            }
            if (x !== 0 || y !== 0) {
                x *= speed;
                y *= speed;
                this.viewport.moveCenter(this.viewport.center.x + x, this.viewport.center.y + y);
            }
            this.updateMouse("pointermove");
        }, 10);

        let me = this;

        function onWindowResize() {
            me.renderer.resize(window.innerWidth, window.innerHeight);
            me.viewport.resize(window.innerWidth, window.innerHeight);
        }

        function onContextMenu(event: UIEvent) {
            event.preventDefault();
        }

        document.oncontextmenu = onContextMenu;
        document.body.oncontextmenu = onContextMenu;

        window.addEventListener("resize", onWindowResize, false);

        // starting position
        this.lookAt({
            target: { x: -10.0, y: -30.0 },
            zoom: 7.0,
        });
    }

    springGFXs: PIXI.Graphics[] = []

    update(stepInfo: SimuloPhysicsStepInfo) {
        for (let key in stepInfo.delta.shapeContent) {
            let content = stepInfo.delta.shapeContent[key];
            this.addShape(content);
        }
        if (Object.keys(stepInfo.delta.shapeContent).length > 0) console.log('registered ' + Object.keys(stepInfo.delta.shapeContent).length + ' shapes')
        this.updatePositions(stepInfo.delta.shapeTransforms);
        // draw a line for each spring, will soon support images
        this.springGFXs.forEach((gfx) => {
            this.viewport.removeChild(gfx)
        });
        this.springGFXs = []
        stepInfo.springs.forEach((spring) => {
            let gfx = new PIXI.Graphics();
            gfx.lineStyle(3 / this.viewport.scale.y, '#ffffff')
                .moveTo(spring.pointA.x, -spring.pointA.y)
                .lineTo(spring.pointB.x, -spring.pointB.y);
            this.springGFXs.push(gfx)
            this.viewport.addChild(gfx);
        })
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
        if (this.coll2gfx.has(content.id)) {
            // remove it so we dont get ghost shapes
            let gfx = this.coll2gfx.get(content.id);
            if (gfx) {
                this.viewport.removeChild(gfx);
            }
        }

        let gfx = new PIXI.Graphics();
        switch (content.type) {
            case "rectangle":
                let rectangle = content as Rectangle;

                /*gfx.scale.x = rectangle.width;
                gfx.scale.y = rectangle.height;
                gfx.beginFill(rectangle.color, 0xff);
                gfx.drawRect(-1, 1, 2, -2);
                gfx.endFill();*/

                // polygon instead since for some reason it doesnt render the rectangle, will try to fix later but for now this works
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
                //gfx.drawCircle(0, 0, 1);
                // arc manually since circle doesnt have enough segments
                gfx.arc(0, 0, 1, 0, Math.PI * 2);
                gfx.endFill();
                break;
            case "polygon":
                let polygon = content as Polygon;
                gfx.beginFill(polygon.color);
                gfx.moveTo(polygon.points[0][0], -polygon.points[0][1]);
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

        this.coll2gfx.set(content.id, gfx);
        this.viewport.addChild(gfx);
    }
}