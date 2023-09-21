import SimuloClientPlugin from "../SimuloClientPlugin";

/** Generic client controller for Simulo.
 * 
 * If you're making a game with Simulo engine, you shouldn't need to modify this, you can simply make your own plugins. */

export default class SimuloClientController {
    plugins: SimuloClientPlugin[] = [];

    /** Register a plugin to have event handlers called on it.
      * 
      * Note that the order of plugins is important, as they are called in order. */
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
    /** Never use this in plugins, you get the data from `handleIncomingEvent` instead. */
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
        if (this.listeners[event]) {
            for (let callback of this.listeners[event]) {
                callback(data);
            }
        }
        if (this.listeners['data']) {
            for (let callback of this.listeners['data']) {
                callback({ event, data });
            }
        }
    }
}