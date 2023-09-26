import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type { Rectangle } from "../../../SimuloPhysicsServerRapier";

import randomColor from "../../../randomColor";

export default class RectangleTool implements PhysicsSandboxTool {
    name = "Rectangle";
    description = "Draw rectangles";
    icon = "icons/square.svg";

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

    startPoint: { x: number, y: number } | null = null;
    color: number | null = null;

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoint = { x: player.x, y: player.y };
        this.color = randomColor();
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    playerUp(player: PhysicsSandboxPlayer) {
        if (!this.startPoint) return;
        this.physicsSandbox.physicsPlugin.physicsServer.addRectangle({
            width: Math.abs(this.startPoint.x - player.x) / 2,
            height: Math.abs(this.startPoint.y - player.y) / 2,
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
            restitution: 0.8,
            position: { x: (this.startPoint.x + player.x) / 2, y: (this.startPoint.y + player.y) / 2 },
        });
        this.startPoint = null;
    }

    update(player: PhysicsSandboxPlayer) {
        if (this.startPoint) {
            // add overlays
            this.physicsSandbox.addOverlayShape({
                content: {
                    width: Math.abs(this.startPoint.x - player.x),
                    height: Math.abs(this.startPoint.y - player.y),
                    color: this.color ?? 0xffffff,
                    alpha: 0.5,
                    zDepth: 0,
                    type: "rectangle",
                    border: 0xffffff,
                    id: "rectangleToolOverlay",
                    borderWidth: 0.1,
                } as Rectangle,
                transform: {
                    x: (this.startPoint.x + player.x) / 2,
                    y: (this.startPoint.y + player.y) / 2,
                    angle: 0,
                }
            });
        }
    }
}