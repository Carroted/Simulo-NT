import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type SimuloObjectData from "../../../SimuloObjectData";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";
import SimuloObject from "../../../SimuloObject";
import SimuloSpring from "../../../SimuloSpring";
import PhysicsSandboxToolSettings from "../PhysicsSandboxToolSettings";

export default class DragTool implements PhysicsSandboxTool {
    name = "Drag";
    description = "Drag physics objects with a spring";
    icon = "icons/cursor-default.svg";
    settings: PhysicsSandboxToolSettings = [
        {
            id: "showForce",
            label: "Show Force",
            value: false,
            type: "checkbox",
        },
        {
            id: "showSpring",
            label: "Show Spring",
            value: false,
            type: "checkbox",
        },
        {
            id: "dragCenterOfMass",
            label: "Drag Center of Mass",
            value: false,
            type: "checkbox",
        },
        // strength and max force
        {
            id: "strength",
            label: "Strength",
            value: 0.5,
            type: "slider",
            min: 0,
            max: 1,
            step: 0.01,
        },
        {
            id: "maxForce",
            label: "Max Force",
            value: 10,
            type: "slider",
            min: 0,
            max: 100,
            step: 0.01,
        }
    ];

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    springs: { [id: string]: SimuloSpring | null } = {};
    startPoints: { [id: string]: { x: number, y: number } | null } = {};

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    playerDown(player: PhysicsSandboxPlayer) {
        this.startPoints[player.id] = { x: player.x, y: player.y };
        let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint({ x: player.x, y: player.y, z: 0 });
        if (target) {
            let bodyA = target;
            if (this.springs[player.id]) {
                this.physicsSandbox.physicsPlugin.physicsServer.removeSpring(this.springs[player.id]!);
                this.springs[player.id] = null;
            }
            this.springs[player.id] = this.physicsSandbox.physicsPlugin.physicsServer.addSpring({
                objectA: bodyA,
                objectB: null,
                stiffness: 0.5,
                localAnchorA: this.physicsSandbox.physicsPlugin.physicsServer.getLocalObjectPoint(bodyA, { x: player.x, y: player.y, z: 0 }),
                localAnchorB: { x: player.x, y: player.y, z: 0 },
                damping: 0.1,
                restLength: 0,
            });
        }
    }
    playerMove(player: PhysicsSandboxPlayer) {
        if (!player.down) return;
        if (!this.springs[player.id]) return;
        this.springs[player.id]!.setLocalAnchorB({
            x: player.x,
            y: player.y,
            z: 0,
        });
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