import type SimuloServerPlugin from "../SimuloServerPlugin";
import type SimuloServerController from "../SimuloServerController";
//import SimuloPhysicsServerRapier, { SimuloPhysicsStepInfo } from "../SimuloPhysicsServerRapier";
import SimuloPhysicsServerP2, { SimuloPhysicsStepInfo } from "../SimuloPhysicsServerP2";

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
    physicsServer: SimuloPhysicsServerP2;
    previousStepInfo: SimuloPhysicsStepInfo | null = null;
    paused = false;

    constructor(controller: SimuloServerController) {
        this.controller = controller;
        this.physicsServer = new SimuloPhysicsServerP2();
    }
    async init() {
        // oops i forgot to do anything
    }
    start(): void {
        console.log("start");
    }
    update(): void {
        if (this.paused) {
            // we dont want to step the world, but the world can still change if the players add stuff.
            // so, we must render the world again with updated step info
            let stepInfo = this.physicsServer.getStepInfo([], new Date().getTime()); // get updated world state, no collision sounds, and before is set to right now
            this.previousStepInfo = stepInfo;
            return;
        }

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