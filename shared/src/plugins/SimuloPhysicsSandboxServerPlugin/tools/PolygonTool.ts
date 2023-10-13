import type PhysicsSandboxTool from "../PhysicsSandboxTool";
import type SimuloPhysicsSandboxServerPlugin from "..";
import type PhysicsSandboxPlayer from "../PhysicsSandboxPlayer";

import randomColor from "../../../randomColor";

export default class PolygonTool implements PhysicsSandboxTool {
    name = "Polygon";
    description = "Draw polygons";
    icon = "icons/polygon.svg";

    physicsSandbox: SimuloPhysicsSandboxServerPlugin;

    constructor(physicsSandbox: SimuloPhysicsSandboxServerPlugin) {
        this.physicsSandbox = physicsSandbox;
    }

    points: { [id: string]: { x: number, y: number }[] } = {};
    color: number | null = null;

    playerDown(player: PhysicsSandboxPlayer) {
        this.points[player.id] = [{ x: player.x, y: player.y }];
        this.color = randomColor();
    }
    playerMove(player: PhysicsSandboxPlayer) {
        // make sure its more than 0.1 away
        if (!this.points[player.id] || this.points[player.id].length < 1) return;
        let lastPoint = this.points[player.id][this.points[player.id].length - 1];
        if (Math.abs(lastPoint.x - player.x) < 0.5 && Math.abs(lastPoint.y - player.y) < 0.5) return;
        this.points[player.id].push({ x: player.x, y: player.y });
    }
    playerUp(player: PhysicsSandboxPlayer) {
        let points = this.points[player.id];
        if (!points || points.length < 3) return;
        // remove double point, then check length again
        let filteredPoints = points.filter((point, index) => {
            return index === 0 || !(point.x === points[index - 1].x && point.y === points[index - 1].y);
        });
        // add start point to end
        filteredPoints.push(filteredPoints[0]);
        if (filteredPoints.length < 3) return;

        this.physicsSandbox.physicsPlugin.physicsServer.addPolygon({
            points: filteredPoints,
            color: this.color ?? 0xffffff,
            alpha: 1,
            name: "Rectangle",
            border: null,
            borderScaleWithZoom: true,
            borderWidth: 0.1,
            image: null,
            sound: "/assets/sounds/impact.wav",
            zDepth: 0,
            isStatic: false,
            density: 1,
            friction: 0.5,
            restitution: 0.8,
            position: { x: 0, y: 0 }, // since points are world space, we need to set the position to 0,0. soon we will switch this up and subtract stuff so its better lol
        });
        this.points[player.id] = [];
    }

    update(player: PhysicsSandboxPlayer) {
        /*let startPoint = this.startPoints[player.id];

        if (startPoint) {
            // add overlays
            this.physicsSandbox.addOverlayShape({
                content: {
                    width: Math.abs(startPoint.x - player.x),
                    height: Math.abs(startPoint.y - player.y),
                    depth: 1,
                    color: this.color ?? 0xffffff,
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
        }*/
    }
}