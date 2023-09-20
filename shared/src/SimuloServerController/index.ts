import SimuloServerPlugin from "../SimuloServerPlugin";

/** Simulo "clienthost" or dedicated game server, NOT a web server. */
export default class SimuloServerController {
    /** Measured in frames per second, NOT in format like `1000 / 60` */
    frameRate: number = 60;
    plugins: SimuloServerPlugin[] = [];
    /** Register a plugin to have event handlers called on it.
     * 
     * Note that the order of plugins is important, as they are called in order. For instance, you probably want physics to be called before networking. */
    addPlugin(plugin: SimuloServerPlugin) {
        this.plugins.push(plugin);
    }
    /** Remove a plugin, and call its destroy method. */
    removePlugin(plugin: SimuloServerPlugin) {
        plugin.destroy();
        this.plugins.splice(this.plugins.indexOf(plugin), 1);
    }
    runStarts() {
        for (let plugin of this.plugins) {
            plugin.start();
        }
    }
    runUpdates() {
        for (let plugin of this.plugins) {
            plugin.update();
        }
    }
    destroy() {
        for (let plugin of this.plugins) {
            plugin.destroy();
        }
    }
    handleIncomingEvent(event: string, data: any, id: string) {
        for (let plugin of this.plugins) {
            plugin.handleIncomingEvent(event, data, id);
        }
    }
    handleOutgoingEvent(event: string, data: any, id: string | null) {
        for (let plugin of this.plugins) {
            plugin.handleOutgoingEvent(event, data, id);
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

    emit(event: string, data: any, id: string | null) {
        this.handleOutgoingEvent(event, data, id);
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

    loopInterval: any = null;

    startLoop() {
        this.runStarts();

        this.loopInterval = setInterval(() => {
            this.runUpdates();
        }, 1000 / this.frameRate);
    }

    stopLoop() {
        if (this.loopInterval !== null) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
    }
}