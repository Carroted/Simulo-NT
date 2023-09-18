import type SimuloServerPlugin from "../../../../shared/src/SimuloServerPlugin";
import type SimuloServerController from "../../../../shared/src/SimuloServerController";

export default class SimuloBrowserNetworkServerPlugin implements SimuloServerPlugin {
    name = "Simulo Browser Network Server Plugin";
    description = "WebRTC network server that runs in the browser.";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-browser-network-server-plugin";
    dependencies = [];
    controller: SimuloServerController;
    /** we fire packets at a fixed rate, so we need to buffer them */
    dataBuffer: {
        event: string;
        data: any;
    }[] = [];

    constructor(controller: SimuloServerController) {
        this.controller = controller;
    }

    start(): void { }
    update(): void { }
    destroy(): void { }
    handleIncomingEvent(event: string, data: any): void { } // nothing here
    handleOutgoingEvent(event: string, data: any): void {
        // we need to buffer the data
        this.dataBuffer.push({
            event: event,
            data: data
        });
    }
}