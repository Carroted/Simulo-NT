
import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type SimuloObjectData from "../../../SimuloObjectData";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";

export default class SpringTool implements PhysicsSandboxTool {
    name = "Spring";
    description = "Draw springs, real";
    icon = "icons/spring.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    startPoints: { [id: string]: { x: number, y: number } | null } = {};

    playerDown(player: PhysicsSandboxPlayer) {
        /*let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        if (target) {*/
        this.startPoints[player.id] = { x: player.x, y: player.y };
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

    playerUp(player: PhysicsSandboxPlayerExtended) {
        let startPoint = this.startPoints[player.id];
        if (!startPoint) return;

        // if its at same point it started at, change selection
        if (this.physicsSandbox.selectionUpdate(startPoint, player)) {
            this.startPoints[player.id] = null;
            return;
        }

        let targetA = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(startPoint.x, startPoint.y);
        let targetB = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);

        if (!targetA && !targetB) return; // only return if both missing, otherwise we can do something like the above comment block

        let bodyA = targetA;
        let bodyB = targetB;

        if (!bodyA && !bodyB) return; // only return if both missing, otherwise we can do something like the above comment block


        this.startPoints[player.id] = null;
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    update(player: PhysicsSandboxPlayer) {
        // overlay coming soon
    }
}
