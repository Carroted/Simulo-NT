import SimuloServerPlugin from "../SimuloServerPlugin";

/** Simulo "clienthost" or dedicated game server, NOT a web server. */

export default class SimuloServerController {
    /** Measured in frames per second, NOT in format like `1000 / 60` */
    frameRate: number;

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
    async runStarts() {
        for (let plugin of this.plugins) {
            try {
                await plugin.start().catch((e: any) => { console.error(e); });
            }
            catch (e) { }
        }
    }
    async runUpdates() {
        for (let plugin of this.plugins) {
            try {
                await plugin.update().catch((e: any) => { console.error(e); });
            }
            catch (e) { }
        }
    }
    async destroy() {
        for (let plugin of this.plugins) {
            try {
                await plugin.destroy().catch((e: any) => { console.error(e); });
            }
            catch (e) { }
        }
    }
    async handleIncomingEvent(event: string, data: any, id: string) {
        for (let plugin of this.plugins) {
            await plugin.handleIncomingEvent(event, data, id);
        }
    }
    async handleOutgoingEvent(event: string, data: any, id: string | null) {
        for (let plugin of this.plugins) {
            await plugin.handleOutgoingEvent(event, data, id);
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

    async emit(event: string, data: any, id: string | null) {
        await this.handleOutgoingEvent(event, data, id);
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

    private loopInterval: any = null;

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

    constructor(frameRate: number = 60) {
        this.frameRate = frameRate;
    }
}