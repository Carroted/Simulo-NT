import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";

export default class DragTool implements PhysicsSandboxTool {
    name = "Drag";
    description = "Drag physics objects with a spring";
    icon = "icons/cursor-default.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    playerDown(player: PhysicsSandboxPlayer) {
        let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        if (target) {
            let bodyANullable = target.parent();
            if (bodyANullable !== null) {
                let bodyA = bodyANullable;
                this.physicsSandbox.physicsPlugin.physicsServer.springs.push({
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

                    stiffness: 1,
                    localAnchorA: this.physicsSandbox.physicsPlugin.physicsServer.getLocalPoint(bodyA.translation(), bodyA.rotation(), { x: player.x, y: player.y }),
                    localAnchorB: { x: 0, y: 0 },
                    targetLength: 0,
                    damping: 1
                });
            }
        }
    }
    playerMove(player: PhysicsSandboxPlayer) {
        if (!player.down) return;

        this.physicsSandbox.physicsPlugin.physicsServer.springs.forEach(spring => {
            spring.getBodyBPosition = () => {
                return { x: player.x, y: player.y };
            };
        });
    }
    playerUp(player: PhysicsSandboxPlayer) {
        this.physicsSandbox.physicsPlugin.physicsServer.springs = [];
    }
    update(player: PhysicsSandboxPlayer) { }
}