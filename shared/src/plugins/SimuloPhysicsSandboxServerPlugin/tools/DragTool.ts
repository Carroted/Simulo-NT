import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import { SimuloSpring } from "../../../SimuloPhysicsServerRapier";
import type SimuloObjectData from "../../../SimuloObjectData";

export default class DragTool implements PhysicsSandboxTool {
    name = "Drag";
    description = "Drag physics objects with a spring";
    icon = "icons/cursor-default.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    springs: { [id: string]: SimuloSpring | null } = {};

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    playerDown(player: PhysicsSandboxPlayer) {
        let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        if (target) {
            let bodyANullable = target.parent();
            if (bodyANullable !== null) {
                let bodyA = bodyANullable;
                if (this.springs[player.id]) {
                    this.springs[player.id]!.destroy();
                    this.springs[player.id] = null;
                }
                this.springs[player.id] = this.physicsSandbox.physicsPlugin.physicsServer.addSpring({
                    // positions
                    getBodyAPosition: () => { return bodyA.translation() },
                    getBodyBPosition: () => { return { x: player.x, y: player.y } },

                    // rotations
                    getBodyARotation: () => { return bodyA.rotation() },
                    getBodyBRotation: () => { return 0; },

                    // velocities
                    getBodyAVelocity: () => { return bodyA.linvel() },
                    getBodyBVelocity: () => { return { x: 0, y: 0 }; },

                    // impulses
                    applyBodyAImpulse: (impulse, worldPoint) => {
                        bodyA.applyImpulseAtPoint(impulse, worldPoint, true);
                    },
                    applyBodyBImpulse: (impulse, worldPoint) => { },

                    stiffness: 10,
                    localAnchorA: this.physicsSandbox.physicsPlugin.physicsServer.getLocalPoint(bodyA.translation(), bodyA.rotation(), { x: player.x, y: player.y }),
                    localAnchorB: { x: 0, y: 0 },
                    targetLength: 0,
                    damping: 1,

                    // ids
                    bodyA: (bodyA.userData as SimuloObjectData).id,
                    bodyB: null,
                });
            }
        }
    }
    playerMove(player: PhysicsSandboxPlayer) {
        if (!player.down) return;
        if (!this.springs[player.id]) return;

        this.springs[player.id]!.getBodyBPosition = () => {
            return { x: player.x, y: player.y };
        };
    }
    playerUp(player: PhysicsSandboxPlayer) {
        if (!this.springs[player.id]) return;

        this.springs[player.id]!.destroy();
        this.springs[player.id] = null;
    }
    update(player: PhysicsSandboxPlayer) { }
}