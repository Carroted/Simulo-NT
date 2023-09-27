import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type { Ball } from "../../../SimuloPhysicsServerRapier";

import randomColor from "../../../randomColor";

export default class CircleTool implements PhysicsSandboxTool {
    name = "Circle";
    description = "Draw circles";
    icon = "icons/circle.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    startPoint: { x: number, y: number } | null = null;
    color: number | null = null;

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoint = { x: player.x, y: player.y };
        this.color = randomColor();
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    playerUp(player: PhysicsSandboxPlayer) {
        if (!this.startPoint) return;
        this.physicsSandbox.physicsPlugin.physicsServer.addCircle({
            radius: Math.max(Math.abs(this.startPoint.x - player.x) / 2, Math.abs(this.startPoint.y - player.y) / 2),
            color: this.color ?? 0xffffff,
            alpha: 1,
            name: "Circle",
            border: null,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: null,
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
                    radius: Math.max(Math.abs(this.startPoint.x - player.x) / 2, Math.abs(this.startPoint.y - player.y) / 2),
                    color: this.color ?? 0xffffff,
                    alpha: 0.5,
                    zDepth: 0,
                    type: "ball",
                    border: 0xffffff,
                    id: "circleToolOverlay",
                    borderWidth: 0.1,
                    cakeSlice: false,
                } as Ball,
                transform: {
                    x: (this.startPoint.x + player.x) / 2,
                    y: (this.startPoint.y + player.y) / 2,
                    z: 0,
                    angle: 0,
                }
            });
        }
    }
}