import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type { Cuboid } from "../../../ShapeContentData";

import randomColor from "../../../randomColor";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";
import PhysicsSandboxToolSettings from "../PhysicsSandboxToolSettings";

export default class RectangleTool implements PhysicsSandboxTool {
    name = "Rectangle";
    description = "Draw rectangles";
    icon = "icons/square.svg";
    settings: PhysicsSandboxToolSettings = [];

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    /*
    spawnCube(x: number, y: number) {
        this.physicsSandbox.physicsPlugin.physicsServer.addRectangle({
            width: 0.5,
            height: 0.5,
            color: 0xff5520,
            name: "Cube",
            border: 0x000000,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: null,
            zDepth: 0,
            isStatic: false,
            density: 1,
            friction: 0.5,
            restitution: 0.8,
            position: { x, y },
        });
    }*/

    startPoints: { [id: string]: { x: number, y: number } | null } = {};
    color: number | null = null;

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoints[player.id] = { x: player.x, y: player.y };
        this.color = randomColor();
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    playerUp(player: PhysicsSandboxPlayerExtended) {
        let startPoint = this.startPoints[player.id];
        if (!startPoint) return;

        // if its at same point it started at, change selection
        if (this.physicsSandbox.selectionUpdate(startPoint, player)) {
            this.startPoints[player.id] = null;
            return;
        }

        this.physicsSandbox.physicsPlugin.physicsServer.addCuboid({
            width: Math.abs(startPoint.x - player.x),
            height: Math.abs(startPoint.y - player.y),
            depth: 1,
            color: this.color ?? 0xffffff,
            alpha: 1,
            name: "Rectangle",
            border: null,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: "/assets/sounds/impact.wav",
            zDepth: 0,
            isStatic: false,
            density: 1,
            friction: 0.5,
            restitution: 0.3,
            position: { x: (startPoint.x + player.x) / 2, y: (startPoint.y + player.y) / 2 },
        });
        this.startPoints[player.id] = null;
    }

    update(player: PhysicsSandboxPlayer) {
        let startPoint = this.startPoints[player.id];

        if (startPoint) {
            // add overlays
            this.physicsSandbox.addOverlayShape({
                content: {
                    width: Math.abs(startPoint.x - player.x),
                    height: Math.abs(startPoint.y - player.y),
                    depth: 1,
                    color: this.color ?? 0xffffff,
                    alpha: 0.5,
                    zDepth: 0,
                    type: "cuboid",
                    border: 0xffffff,
                    id: "rectangleToolOverlay",
                    borderWidth: 0.1,
                    name: "Rectangle",
                    description: null,
                    borderScaleWithZoom: true,
                    borderAlpha: 1,
                    image: null,
                    imageTransformations: null,
                    text: null,
                } as Cuboid,
                transform: {
                    x: (startPoint.x + player.x) / 2,
                    y: (startPoint.y + player.y) / 2,
                    z: 0,
                    angle: 0,
                }
            });
        }
    }
}