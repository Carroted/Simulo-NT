import SimuloPhysicsPlugin from "../../shared/src/plugins/SimuloPhysicsPlugin";
import SimuloPhysicsSandboxServerPlugin from "../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin";
import SimuloPhysicsSandboxClientPlugin from "./plugins/client/SimuloPhysicsSandboxClientPlugin";
import SimuloServerController from "../../shared/src/SimuloServerController";
import SimuloClientController from "./SimuloClientController";

let server = new SimuloServerController();
let physicsPlugin = new SimuloPhysicsPlugin(server);
let physicsSandboxServerPlugin = new SimuloPhysicsSandboxServerPlugin(server, physicsPlugin);

server.addPlugin(physicsPlugin);
server.addPlugin(physicsSandboxServerPlugin);

server.handleIncomingEvent("connect", {
    id: "local",
}, "local");

let client = new SimuloClientController();
let physicsSandboxClientPlugin = new SimuloPhysicsSandboxClientPlugin(client);

client.addPlugin(physicsSandboxClientPlugin);

// loopback, so simple that we don't need a plugin for this
server.on('data', (data: any) => {
    // any emitted server data is instantly handled on client
    client.handleIncomingEvent(data.event, data.data);
});

server.startLoop();