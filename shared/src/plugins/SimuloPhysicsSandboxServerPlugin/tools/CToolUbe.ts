
import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";

import randomColor from "../../../randomColor";

function randomRange(min: number, max: number): number {
    const range = max - min;
    return Math.random() * range + min;
  }


export default class CToolUbe implements PhysicsSandboxTool {
    name = "CToolUbe";
    description = "Cube-inator";
    icon = "icons/spring.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    spawnCube(x: number, y: number) {
        this.physicsSandbox.physicsPlugin.physicsServer.addRectangle({
            width: 0.5,
            height: 0.5,
            color: randomColor(),
            alpha: 1,
            name: "Cube",
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
            position: { x, y },
        });
    }

    playerDown(player: PhysicsSandboxPlayer) {
        this.spawnCube(player.x, player.y);
    }
    playerMove(player: PhysicsSandboxPlayer) { }
    playerUp(player: PhysicsSandboxPlayer) { }

    frameCount = 0;
    update(player: PhysicsSandboxPlayer) {
        let offsetX = randomRange(-5, 5);
        let offsetY = randomRange(-5, 5);

        if (player.down) {
                this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
 offsetX = randomRange(-5, 5);
         offsetY = randomRange(-5, 5);
this.spawnCube(player.x + offsetX, player.y + offsetY);
        }
        else {
            this.frameCount = 0;
        }
    }
}
