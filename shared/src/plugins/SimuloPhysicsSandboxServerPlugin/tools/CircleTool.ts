import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import { Ball } from "../../../ShapeContentData";

import randomColor from "../../../randomColor";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";

export default class CircleTool implements PhysicsSandboxTool {
    name = "Circle";
    description = "Draw circles";
    icon = "icons/circle.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

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

        if (this.physicsSandbox.selectionUpdate(startPoint, player)) {
            this.startPoints[player.id] = null;
            return;
        }

        this.physicsSandbox.physicsPlugin.physicsServer.addBall({
            radius: Math.max(Math.abs(startPoint.x - player.x) / 2, Math.abs(startPoint.y - player.y) / 2),
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
            restitution: 0.3,
            position: { x: (startPoint.x + player.x) / 2, y: (startPoint.y + player.y) / 2 },
            cakeSlice: true,
        });
        this.startPoints[player.id] = null;
    }

    update(player: PhysicsSandboxPlayer) {
        let startPoint = this.startPoints[player.id];

        if (startPoint) {
            // add overlays
            this.physicsSandbox.addOverlayShape({
                content: {
                    radius: Math.max(Math.abs(startPoint.x - player.x) / 2, Math.abs(startPoint.y - player.y) / 2),
                    color: this.color ?? 0xffffff,
                    alpha: 0.5,
                    zDepth: 0,
                    type: "ball",
                    border: 0xffffff,
                    id: "circleToolOverlay",
                    borderWidth: 0.1,
                    cakeSlice: true,
                    name: "Circle",
                    description: null,
                    borderScaleWithZoom: true,
                    borderAlpha: 1,
                    image: null,
                    imageTransformations: null,
                    text: null,
                } as Ball,
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