import SimuloPhysicsPlugin from "../../shared/src/plugins/SimuloPhysicsPlugin";
import SimuloPhysicsSandboxServerPlugin from "../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin";
import SimuloServerController from "../../shared/src/SimuloServerController";

let controller = new SimuloServerController();
let physicsPlugin = new SimuloPhysicsPlugin(controller);
let physicsSandboxPlugin = new SimuloPhysicsSandboxServerPlugin(controller, physicsPlugin);

controller.addPlugin(physicsPlugin);
controller.addPlugin(physicsSandboxPlugin);

controller.handleIncomingEvent("connect", {
    id: "local",
});