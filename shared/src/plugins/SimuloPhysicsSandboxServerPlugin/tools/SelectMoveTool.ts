import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";
import type { Cuboid } from "../../../SimuloPhysicsServerP2";
import PhysicsSandboxPlayerExtended from "../PhysicsSandboxPlayerExtended";
import * as p2 from "p2-es";

export default class SelectMoveTool implements PhysicsSandboxTool {
    name = "Select and Move";
    description = "Box select and/or move";
    icon = "icons/cursor-move.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    startPoints: { [id: string]: { x: number, y: number } | null } = {};
    shapes: { [id: string]: p2.Body[] } = {}; // if empty, we select, if not, we move
    previousPositions: { [id: string]: { x: number, y: number } } = {};
    shapeBodyMasses: { [id: string]: { [handle: number]: number } } = {};

    playerDown(player: PhysicsSandboxPlayerExtended) {
        this.startPoints[player.id] = { x: player.x, y: player.y };
        // shape at cursor
        let target = this.physicsSandbox.physicsPlugin.physicsServer.getObjectAtPoint(player.x, player.y);
        // if no target, select. else if target in selection, move selection. else, select target and start moving
        if (!target) {
            // select
            this.shapes[player.id] = [];
        } else {
            // move, check .handle
            if (player.selectedObjects.find(shape => shape.id == target!.id)) {
                // move selection
                this.shapes[player.id] = player.selectedObjects;
            } else {
                // select target and start moving
                this.shapes[player.id] = [target];
                // selection is now that
                this.physicsSandbox.players[player.id].selectedObjects = [target];
            }
        }
        // make all shapes kinematic
        this.shapes[player.id].forEach(shape => {
            let parent = shape;
            if (parent) {
                if (!this.shapeBodyMasses[player.id]) {
                    this.shapeBodyMasses[player.id] = {};
                }
                this.shapeBodyMasses[player.id][parent.id] = parent.mass;
                parent.mass = 0;
            }
        });
        this.previousPositions[player.id] = { x: player.x, y: player.y };
    }
    playerMove(player: PhysicsSandboxPlayer) {
        // if theres prevpos and shapes, move
        let prevPos = this.previousPositions[player.id];
        let shapes = this.shapes[player.id];
        if (prevPos && shapes && shapes.length) {
            let deltaX = player.x - prevPos.x;
            let deltaY = player.y - prevPos.y;
            shapes.forEach(shape => {
                let parent = shape;
                if (parent) {
                    parent.position[0] = parent.position[0] + deltaX;
                    parent.position[1] = parent.position[1] + deltaY;
                }
            });
        }
        this.previousPositions[player.id] = { x: player.x, y: player.y };
    }
    playerUp(player: PhysicsSandboxPlayer) {
        // restore body types
        this.shapes[player.id].forEach(shape => {
            let parent = shape;
            if (parent) {
                parent.mass = this.shapeBodyMasses[player.id][parent.id];
                // for some reason body seems to be in pseudosleep after kinematic to dynamic conversion or something, .wakeUp on its own does nothing
                // (try it, remove .sleep, select falling grid of bodies that dont touch, move them, unpause, then release while unpaused and unmoving, they should float)
                // after loads of experimentation, the only way to actually get this to work is to sleep and wake up the body
                // i know it doesnt seem to make sense, but try it if you dont believe me, it can take a few tries to get that bug to happen
                // with this it doesnt seem to happen anymore
                parent.sleep();
                parent.wakeUp();
            }
        });

        if (!this.shapes[player.id] || !this.shapes[player.id].length) {
            let startPoint = this.startPoints[player.id];

            if (startPoint) {
                //let objects = this.physicsSandbox.physicsPlugin.physicsServer.g
                this.physicsSandbox.players[player.id].selectedObjects = this.physicsSandbox.physicsPlugin.physicsServer.getObjectsInRect(startPoint, {
                    x: player.x,
                    y: player.y
                });
                console.log('selection length is', this.physicsSandbox.players[player.id].selectedObjects.length);
            }
        }
        this.startPoints[player.id] = null;
        this.shapes[player.id] = [];
        this.previousPositions[player.id] = { x: player.x, y: player.y };
    }

    update(player: PhysicsSandboxPlayer) {
        if (!this.shapes[player.id] || !this.shapes[player.id].length) {
            let startPoint = this.startPoints[player.id];

            if (startPoint) {
                // add overlays
                this.physicsSandbox.addOverlayShape({
                    content: {
                        width: Math.abs(startPoint.x - player.x),
                        height: Math.abs(startPoint.y - player.y),
                        depth: 1,
                        color: 0xffffff,
                        alpha: 0.5,
                        zDepth: 0,
                        type: "cuboid",
                        border: 0xffffff,
                        id: "rectangleToolOverlay",
                        borderWidth: 0.1,
                    } as Cuboid,
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
}