import type SimuloServerPlugin from "../SimuloServerPlugin";
import type SimuloServerController from "../SimuloServerController";
import SimuloPhysicsServerRapier, { SimuloPhysicsStepInfo } from "../SimuloPhysicsServerRapier";

/** SimuloPhysicsServerRapier as a plugin, which is a rapier physics wrapper that also adds springs */

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
    previousStepInfo: SimuloPhysicsStepInfo | null = null;
    paused = false;

    constructor(controller: SimuloServerController) {
        this.controller = controller;
        this.physicsServer = new SimuloPhysicsServerRapier();
    }
    async init() {
        await this.physicsServer.init();
    }
    start(): void {
        console.log("start");
    }
    update(): void {
        if (this.paused) return;

        let stepInfo = this.physicsServer.step();
        // physics plugin doesnt directly emit data, instead it should be before other plugins in execution order
        // plugins can then use previousStepInfo to get physics data, and send all data in one packet
        this.previousStepInfo = stepInfo;
    }
    destroy(): void {
        console.log("destroy");
    }
    handleIncomingEvent(event: string, data: any, id: string): void { }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}