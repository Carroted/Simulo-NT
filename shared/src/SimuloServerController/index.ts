import SimuloServerPlugin from "../SimuloServerPlugin";

export default class SimuloServerController {
    /** Measured in frames per second, NOT in format like `1000 / 60` */
    frameRate: number = 60;
    plugins: SimuloServerPlugin[] = [];
    addPlugin(plugin: SimuloServerPlugin) {
        this.plugins.push(plugin);
    }
    removePlugin(plugin: SimuloServerPlugin) {
        plugin.destroy();
        this.plugins.splice(this.plugins.indexOf(plugin), 1);
    }
    start() {
        for (let plugin of this.plugins) {
            plugin.start();
        }
    }
    update() {
        for (let plugin of this.plugins) {
            plugin.update();
        }
    }
    destroy() {
        for (let plugin of this.plugins) {
            plugin.destroy();
        }
    }
    handleIncomingEvent(event: string, data: any) {
        for (let plugin of this.plugins) {
            plugin.handleIncomingEvent(event, data);
        }
    }
    handleOutgoingEvent(event: string, data: any) {
        for (let plugin of this.plugins) {
            plugin.handleOutgoingEvent(event, data);
        }
    }

    listeners: { [event: string]: ((data: any) => void)[] } = {};
    /** Never use this in plugins. */
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    /** Never use this in plugins. */
    off(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) return;
        this.listeners[event].splice(this.listeners[event].indexOf(callback), 1);
    }

    emit(event: string, data: any) {
        this.handleOutgoingEvent(event, data);
        for (let callback of this.listeners[event]) {
            callback(data);
        }
    }
}