import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type SimuloObjectData from "../../../SimuloObjectData";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";
import * as p2 from "p2-es";

export default class DragTool implements PhysicsSandboxTool {
    name = "Drag";
    description = "Drag physics objects with a spring";
    icon = "icons/cursor-default.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    springs: { [id: string]: p2.LinearSpring | null } = {};
    startPoints: { [id: string]: { x: number, y: number } | null } = {};
    groundBodies: { [id: string]: p2.Body | null } = {}; // in box2d, ground bodies are used to anchor joints to the world, we reuse that name because its familiar

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoints[player.id] = { x: player.x, y: player.y };
        let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        if (target) {
            let bodyA = target;
            if (this.springs[player.id]) {
                this.physicsSandbox.physicsPlugin.physicsServer.removeSpring(this.springs[player.id]!);
                this.springs[player.id] = null;
            }
            let ground = this.groundBodies[player.id];
            if (!ground) {
                ground = new p2.Body();
                this.physicsSandbox.physicsPlugin.physicsServer.world.addBody(ground);
                this.groundBodies[player.id] = ground;
            }
            this.springs[player.id] = this.physicsSandbox.physicsPlugin.physicsServer.addSpring({
                bodyA,
                bodyB: ground,
                stiffness: 5,
                localAnchorA: this.physicsSandbox.physicsPlugin.physicsServer.getLocalPoint(bodyA, [player.x, player.y]),
                localAnchorB: [0, 0],
                damping: 0.1,
                restLength: 0,
            });
        }
    }
    playerMove(player: PhysicsSandboxPlayer) {
        if (!player.down) return;
        if (!this.groundBodies[player.id]) return;

        let ground = this.groundBodies[player.id]!;
        ground.position[0] = player.x;
        ground.position[1] = player.y;
    }
    playerUp(player: PhysicsSandboxPlayerExtended) {
        // if its at same point it started at, change selection
        let startPoint = this.startPoints[player.id];
        if (startPoint) {
            this.physicsSandbox.selectionUpdate(startPoint, player);
        }

        if (!this.springs[player.id]) return;

        this.physicsSandbox.physicsPlugin.physicsServer.removeSpring(this.springs[player.id]!);
        this.springs[player.id] = null;
    }
    update(player: PhysicsSandboxPlayer) { }
}