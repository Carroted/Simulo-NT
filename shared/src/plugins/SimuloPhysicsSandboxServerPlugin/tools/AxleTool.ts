
import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type SimuloObjectData from "../../../SimuloObjectData";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";

export default class AxleTool implements PhysicsSandboxTool {
    name = "Axle";
    description = "Draw axles, also known as hinges, swivels and pivots";
    icon = "icons/axle.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    startPoints: { [id: string]: { x: number, y: number } | null } = {};

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoints[player.id] = { x: player.x, y: player.y };
    }

    playerUp(player: PhysicsSandboxPlayerExtended) {
        let startPoint = this.startPoints[player.id];
        if (!startPoint) return;

        let targets = this.physicsSandbox.physicsPlugin.physicsServer.getObjectsAtPoint({
            x: startPoint.x,
            y: startPoint.y,
            z: 0
        });
        if (targets.length < 2) return;
        let targetA = targets[0];
        let targetB = targets[1];

        let bodyA = targetA;
        let bodyB = targetB;

        if (!bodyA || !bodyB) return;

        this.physicsSandbox.physicsPlugin.physicsServer.addAxle({
            bodyA,
            bodyB,
            localAnchorA: bodyA ? this.physicsSandbox.physicsPlugin.physicsServer.getLocalObjectPoint(bodyA, { x: startPoint.x, y: startPoint.y, z: 0 }) : { x: 0, y: 0, z: 0 },
            localAnchorB: bodyB ? this.physicsSandbox.physicsPlugin.physicsServer.getLocalObjectPoint(bodyB, { x: startPoint.x, y: startPoint.y, z: 0 }) : { x: 0, y: 0, z: 0 },
        });

        this.startPoints[player.id] = null;
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    update(player: PhysicsSandboxPlayer) {
        // overlay coming soon
    }
}
