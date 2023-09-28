
import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type SimuloObjectData from "../../../SimuloObjectData";

export default class SpringTool implements PhysicsSandboxTool {
    name = "Spring";
    description = "Draw springs, real";
    icon = "icons/spring.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    startPoint: { x: number, y: number } | null = null;

    playerDown(player: PhysicsSandboxPlayer) {
        /*let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        if (target) {*/
        this.startPoint = { x: player.x, y: player.y };
        /*
                    let bodyANullable = target.parent();
                    if (bodyANullable !== null) {
                        let bodyA = bodyANullable;
                        if (this.spring) {
                            this.spring.destroy();
                            this.spring = null;
                        }
                        this.spring = this.physicsSandbox.physicsPlugin.physicsServer.addSpring({
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
                }*/
    }

    playerUp(player: PhysicsSandboxPlayer) {
        if (!this.startPoint) return;

        let targetA = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(this.startPoint.x, this.startPoint.y);
        let targetB = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);

        if (!targetA && !targetB) return; // only return if both missing, otherwise we can do something like the above comment block

        let bodyA = targetA?.parent() ?? null;
        let bodyB = targetB?.parent() ?? null;

        if (!bodyA && !bodyB) return; // only return if both missing, otherwise we can do something like the above comment block

        this.physicsSandbox.physicsPlugin.physicsServer.addSpring({
            // positions
            getBodyAPosition: () => { return bodyA?.translation() ?? { x: 0, y: 0 } },
            getBodyBPosition: () => { return bodyB?.translation() ?? { x: 0, y: 0 } },

            // rotations
            getBodyARotation: () => { return bodyA?.rotation() ?? 0 },
            getBodyBRotation: () => { return bodyB?.rotation() ?? 0 },

            // velocities
            getBodyAVelocity: () => { return bodyA?.linvel() ?? { x: 0, y: 0 } },
            getBodyBVelocity: () => { return bodyB?.linvel() ?? { x: 0, y: 0 } },

            // impulses
            applyBodyAImpulse: (impulse, worldPoint) => {
                bodyA?.applyImpulseAtPoint(impulse, worldPoint, true);
            },
            applyBodyBImpulse: (impulse, worldPoint) => {
                bodyB?.applyImpulseAtPoint(impulse, worldPoint, true);
            },

            stiffness: 10,
            localAnchorA: this.physicsSandbox.physicsPlugin.physicsServer.getLocalPoint(bodyA?.translation() ?? { x: 0, y: 0 }, bodyA?.rotation() ?? 0, { x: this.startPoint.x, y: this.startPoint.y }),
            localAnchorB: this.physicsSandbox.physicsPlugin.physicsServer.getLocalPoint(bodyB?.translation() ?? { x: 0, y: 0 }, bodyB?.rotation() ?? 0, { x: player.x, y: player.y }),
            // current distance
            targetLength: Math.sqrt(Math.pow(this.startPoint.x - player.x, 2) + Math.pow(this.startPoint.y - player.y, 2)),
            damping: 1,

            // ids
            bodyA: (bodyA?.userData as SimuloObjectData)?.id ?? null,
            bodyB: (bodyB?.userData as SimuloObjectData)?.id ?? null,
        });

    }
    playerMove(player: PhysicsSandboxPlayer) { }
    update(player: PhysicsSandboxPlayer) {
        // overlay coming soon
    }
}
