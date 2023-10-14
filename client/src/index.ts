import SimuloPhysicsPlugin from "../../shared/src/plugins/SimuloPhysicsPlugin";
import SimuloPhysicsSandboxServerPlugin from "../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin";
import SimuloPhysicsSandboxClientPlugin from "./plugins/client/SimuloPhysicsSandboxClientPlugin";
import SimuloServerController from "../../shared/src/SimuloServerController";
import SimuloClientController from "./SimuloClientController";

console.log('test before doing anything');
let server = new SimuloServerController();
let physicsPlugin = new SimuloPhysicsPlugin(server, "rapier");
await physicsPlugin.init();
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
server.on('data', (data: { event: string, data: any }) => {
    //console.log('Client got data')
    // any emitted server data is instantly handled on client
    client.handleIncomingEvent(data.event, data.data);
});
client.on('data', (data: { event: string, data: any }) => {
    //console.log('Server got data')
    // any emitted client data is instantly handled on server
    server.handleIncomingEvent(data.event, data.data, "local");
});

client.handleIncomingEvent("tools", {
    tools: physicsSandboxServerPlugin.getTools(),
    tool: 'drag'
});

console.log('Starting...')
server.startLoop();

// @ts-ignore
window.server = server;
// @ts-ignore
window.client = client;
// @ts-ignore
window.switchBackends = async (backend: "rapier" | "p2") => {
    server.stopLoop();
    await physicsPlugin.switchBackends(backend);
    console.log('Switched backends');
    server.startLoop();
};