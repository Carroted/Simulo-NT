import type SimuloServerPlugin from "../SimuloServerPlugin";
import type SimuloServerController from "../SimuloServerController";
import SimuloPhysicsServerRapier from "../SimuloPhysicsServerRapier";

export default class SimuloPhysicsPlugin implements SimuloServerPlugin {
    name = "Simulo Physics Plugin";
    description = "Rapier physics for Simulo. This can change physics backends.";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-physics-plugin";
    dependencies = [];
    controller: SimuloServerController;
    physicsServer: SimuloPhysicsServerRapier;
    constructor(controller: SimuloServerController) {
        this.controller = controller;
        this.physicsServer = new SimuloPhysicsServerRapier();
    }
    start(): void {
        console.log("start");
    }
    update(): void {
        let stepInfo = this.physicsServer.step();
    }
    destroy(): void {
        console.log("destroy");
    }
    handleIncomingEvent(event: string, data: any): void { }
    handleOutgoingEvent(event: string, data: any): void { }
}