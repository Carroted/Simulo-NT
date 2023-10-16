import * as PIXI from "pixi.js";
import { OutlineFilter } from '@pixi/filter-outline';
import { Viewport } from "pixi-viewport";
import type { Ball, Polygon, Cuboid, Plane } from "../../../shared/src/ShapeContentData";
import ShapeContentData from "../../../shared/src/ShapeContentData";
import ShapeTransformData from "../../../shared/src/ShapeTransformData";
import type WorldUpdate from "../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/WorldUpdate";
import { SmoothGraphics, LINE_SCALE_MODE, settings } from '@pixi/graphics-smooth';
import SimuloViewer from "../SimuloViewer";
import getParabola from "../getParabola";

PIXI.curves.adaptive = false;

interface GFX {
    selected: boolean;
    gfx: SmoothGraphics | PIXI.Graphics;
}
/** Renderer in PIXI.js for Simulo. You can add shapes with `addShape`, and update their positions with `update`. */

export default class SimuloViewerPIXI implements SimuloViewer {
    coll2gfx: Map<string, GFX>;
    renderer: PIXI.Renderer;
    scene: PIXI.Container;
    viewport: Viewport;
    canvas: HTMLCanvasElement;
    prevGFXPositions: { [id: string]: { x: number, y: number }[] } = {};

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

    audioChannels: { [src: string]: HTMLAudioElement[] } = {};

    playSound(src: string, volume: number) {
        // we prepare 8 audio channels for each sound, we use inactive ones
        if (!this.audioChannels[src]) {
            this.audioChannels[src] = [];
            for (let i = 0; i < 8; i++) {
                let audio = new Audio(src);
                this.audioChannels[src].push(audio);
            }
        }
        // play the first inactive audio channel
        let audio = this.audioChannels[src].find((audio) => audio.paused);
        if (audio) {
            // move back to start
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play();
        }
        else {
            // if we cant find an inactive audio channel, we play the first one
            this.audioChannels[src][0].currentTime = 0;
            this.audioChannels[src][0].volume = volume;
            this.audioChannels[src][0].play();
        }
    }

    mouseDown = false;

    constructor() {
        this.audioChannels = {};

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
            this.mouseDown = true;
            this.updateMouse("pointerdown", { x: e.globalX, y: e.globalY }, e);
        });
        this.viewport.on("pointerup", (e) => {
            this.mouseDown = false;
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

    /** Graphics that are cleared and redrawn each frame, as they are expected to change every frame. */
    tempGFXs: (SmoothGraphics | PIXI.Graphics)[] = [];
    shapeContents: { [id: string]: ShapeContentData } = {};

    update(worldUpdate: WorldUpdate) {
        // remove removedContents
        worldUpdate.delta.removedContents.forEach((id) => {
            let gfx = this.coll2gfx.get(id);
            if (gfx) {
                this.viewport.removeChild(gfx.gfx);
                gfx.gfx.destroy();
                this.coll2gfx.delete(id);
            }
        });

        for (let key in worldUpdate.delta.shapeContent) {
            let content = worldUpdate.delta.shapeContent[key];
            this.addShape(content);
        }
        //if (Object.keys(worldUpdate.delta.shapeContent).length > 0) console.log('registered ' + Object.keys(worldUpdate.delta.shapeContent).length + ' shapes')
        let parabolas = this.updatePositions(worldUpdate.delta.shapeTransforms);
        // draw a line for each spring, will soon support images
        this.tempGFXs.forEach((gfx) => {
            this.viewport.removeChild(gfx)
        });
        this.tempGFXs = [];
        worldUpdate.springs.forEach((spring) => {
            let gfx = new PIXI.Graphics();
            gfx.lineStyle(3 / this.viewport.scale.y, '#ffffff')
                .moveTo(spring.pointA.x, -spring.pointA.y)
                .lineTo(spring.pointB.x, -spring.pointB.y);
            this.tempGFXs.push(gfx)
            this.viewport.addChild(gfx);
        });
        for (let parabola of parabolas) {
            // trace it from object pos - 20 to object pos + 20
            let gfx = new PIXI.Graphics();
            gfx.lineStyle(2 / this.viewport.scale.y, '#ffffff', 0.5);
            for (let x = parabola.x - 40; x < parabola.x + 40; x += 0.1) {
                if (x === parabola.x - 40) {
                    gfx.moveTo(x, -parabola.parabola(x));
                    continue;
                }
                const y = parabola.parabola(x);
                gfx.lineTo(x, -y);
            }
            this.tempGFXs.push(gfx)
            this.viewport.addChild(gfx);
        }
        worldUpdate.overlays.shapes.forEach((shape) => {
            let content = shape.content;
            let transform = shape.transform;
            let gfx = this.renderShape(content);
            gfx.position.x = transform.x;
            gfx.position.y = -transform.y;
            gfx.rotation = -transform.angle;
            this.tempGFXs.push(gfx);
            this.viewport.addChild(gfx);
        });
        worldUpdate.overlays.texts.forEach((text) => {
            // coming soon lol
        });

        worldUpdate.sounds.forEach((sound) => {
            //console.log('##### SOUND ####', sound);
            /*let audio = new Audio(sound.sound);
            audio.volume = sound.volume;
            audio.play();*/
            //this.playSound(sound.sound, sound.volume);
        });

        // if any of our gfxes are in a worldUpdate.selectedObjects, white outline
        let selectedShapes: string[] = [];
        Object.keys(worldUpdate.selectedObjects).forEach((key) => {
            let selectedObjects = worldUpdate.selectedObjects[key];
            selectedObjects.forEach((content) => {
                // find gfx pos
                let realGfx = this.coll2gfx.get(content.id);
                if (realGfx && !realGfx.selected) {
                    let posX = realGfx.gfx.position.x;
                    let posY = realGfx.gfx.position.y;
                    let rotation = realGfx.gfx.rotation;
                    // remove it
                    this.viewport.removeChild(realGfx.gfx);
                    realGfx.gfx.destroy();
                    this.coll2gfx.delete(content.id);
                    let gfx = this.renderShape({
                        ...content,
                        border: 0xffffff,
                        borderWidth: 3
                    });
                    this.shapeContents[content.id] = content;
                    gfx.position.x = posX;
                    gfx.position.y = posY;
                    gfx.rotation = rotation;
                    this.coll2gfx.set(content.id, { selected: true, gfx });
                    this.viewport.addChild(gfx);
                }
                selectedShapes.push(content.id);
            });
        });

        // every shape that isnt in selectedshapes but has selected true will be redrawn from content
        this.coll2gfx.forEach((gfx, key) => {
            if (!selectedShapes.includes(key) && gfx.selected) {
                let posX = gfx.gfx.position.x;
                let posY = gfx.gfx.position.y;
                let rotation = gfx.gfx.rotation;
                this.viewport.removeChild(gfx.gfx);
                gfx.gfx.destroy();
                let newGfx = this.renderShape(this.shapeContents[key]);
                newGfx.position.x = posX;
                newGfx.position.y = posY;
                newGfx.rotation = rotation;
                this.coll2gfx.set(key, { selected: false, gfx: newGfx });
                this.viewport.addChild(newGfx);
            }
        });
    }

    render() {
        this.renderer.render(this.scene);
    }

    lookAt(pos: { zoom: number; target: { x: number; y: number } }) {
        this.viewport.setZoom(pos.zoom);
        this.viewport.moveCenter(pos.target.x, pos.target.y);
    }

    updatePositions(transformData: { [id: string]: ShapeTransformData }): {
        parabola: (x: number) => number,
        x: number
    }[] {
        let parabolas: {
            parabola: (x: number) => number,
            x: number
        }[] = [];
        Object.keys(transformData).forEach((id) => {
            let gfx = this.coll2gfx.get(id);
            let data = transformData[id];
            let position = { x: data.x, y: data.y };
            let angle = data.angle;

            if (!!gfx) {
                gfx.gfx.position.x = position.x;
                gfx.gfx.position.y = -position.y;
                gfx.gfx.rotation = -angle;
                if (gfx.gfx instanceof SmoothGraphics) {
                    if (!this.prevGFXPositions[id]) {
                        this.prevGFXPositions[id] = [];
                    }
                    let prevPos = this.prevGFXPositions[id];
                    // if more than two
                    if (prevPos.length > 2) {
                        // set entire array to the last ones
                        this.prevGFXPositions[id] = [prevPos[prevPos.length - 2], prevPos[prevPos.length - 1]];
                    }
                    this.prevGFXPositions[id].push({ x: position.x, y: position.y });
                    prevPos = this.prevGFXPositions[id];

                    // if Three, we can parabolaify as long as mouse is not down
                    if (prevPos.length === 3 && !this.mouseDown) {
                        // make sure x dist between first and last is enough
                        let dist = Math.abs(prevPos[0].x - prevPos[2].x);
                        if (dist >= 0.1) {
                            let parabola = getParabola(
                                [prevPos[0].x, prevPos[0].y],
                                [prevPos[1].x, prevPos[1].y],
                                [prevPos[2].x, prevPos[2].y],
                            );
                            parabolas.push({
                                parabola: parabola,
                                x: position.x
                            });
                        }
                    }
                }
            }
        });
        return parabolas;
    }

    reset() {
        this.coll2gfx.forEach((gfx) => {
            this.viewport.removeChild(gfx.gfx);
            gfx.gfx.destroy();
        });
        this.coll2gfx = new Map();
        this.prevGFXPositions = {};
    }

    renderShape(content: ShapeContentData) {
        let gfx: SmoothGraphics | PIXI.Graphics;
        if (content.border !== null) {
            gfx = new SmoothGraphics();
            gfx.lineStyle(content.borderWidth ?? 1, content.border, 1, 0, LINE_SCALE_MODE.NONE);
        }
        else {
            gfx = new PIXI.Graphics();
        }
        gfx.alpha = content.alpha;
        switch (content.type) {
            case "cuboid":
                let rectangle = content as Cuboid;

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
            case "ball":
                let circle = content as Ball;

                gfx.beginFill(circle.color);
                //gfx.drawCircle(0, 0, 1);
                // arc manually, we will use startAngle and whatnot
                /*let segments = 4;
                let size = 2 * Math.PI / segments;
                for (let i = 0; i < segments; i++) {
                    gfx.moveTo(0, 0);
                    gfx.arc(0, 0, circle.radius, size * i, size * (i + 1));
                }*/
                //gfx.drawCircle(0, 0, circle.radius);

                // no arc
                let segments = 50;
                let size = 2 * Math.PI / segments;
                // start at top
                gfx.moveTo(0, circle.radius);
                for (let i = 0; i < segments; i++) {
                    gfx.lineTo(Math.sin(size * i) * circle.radius, Math.cos(size * i) * circle.radius);
                }
                gfx.lineTo(0, circle.radius);

                gfx.endFill();

                // "circle cake", 15deg dark slice
                if (circle.cakeSlice) {
                    if (gfx instanceof SmoothGraphics) {
                        gfx.lineStyle(0);
                    }
                    else {
                        gfx.lineStyle(0);
                    }
                    gfx.beginFill(0x000000, 0.5);
                    gfx.moveTo(0, 0);
                    gfx.arc(0, 0, circle.radius, -Math.PI / 16, Math.PI / 16);
                    gfx.lineTo(0, 0);
                    gfx.endFill();
                }
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
            case "plane": // infinite plane, position is on the surface, plane is on bottom of position, angle points up
                gfx.beginFill(content.color);
                gfx.moveTo(-100000, 0);
                gfx.lineTo(100000, 0);
                gfx.lineTo(100000, 100000);
                gfx.lineTo(-100000, 100000);
                gfx.lineTo(-100000, 0);
                gfx.endFill();
                break;
            default:
                console.error("Unknown shape type: " + content.type);
                break;
        }

        return gfx;
    }

    addShape(content: ShapeContentData) {
        if (this.coll2gfx.has(content.id)) {
            // remove it so we dont get ghost shapes
            let gfx = this.coll2gfx.get(content.id);
            if (gfx) {
                this.viewport.removeChild(gfx.gfx);
            }
        }

        let gfx = this.renderShape(content);

        this.coll2gfx.set(content.id, { selected: false, gfx });
        this.viewport.addChild(gfx);
    }
}