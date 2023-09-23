import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";

export default class CubesTool implements PhysicsSandboxTool {
    name = "Cubes";
    description = "Test tool to spam spawn cubes";
    icon = "icons/cube.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    spawnCube(x: number, y: number) {
        this.physicsSandbox.physicsPlugin.physicsServer.addRectangle({
            width: 0.5,
            height: 0.5,
            color: 0xff5520,
            alpha: 1,
            name: "Cube",
            border: 0x000000,
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
    framesPerCube = 1; // this is 60fps
    update(player: PhysicsSandboxPlayer) {
        if (player.down) {
            this.frameCount++;
            if (this.frameCount % this.framesPerCube === 0) {
                this.spawnCube(player.x, player.y);
            }
        }
        else {
            this.frameCount = 0;
        }
    }
}