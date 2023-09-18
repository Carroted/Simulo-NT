import SimuloClientPlugin from "../SimuloClientPlugin";

export default class SimuloClientController {
    plugins: SimuloClientPlugin[] = [];
    addPlugin(plugin: SimuloClientPlugin) {
        this.plugins.push(plugin);
    }
    removePlugin(plugin: SimuloClientPlugin) {
        plugin.destroy();
        this.plugins.splice(this.plugins.indexOf(plugin), 1);
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