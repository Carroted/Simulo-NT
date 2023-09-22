import type SimuloServerController from "../../../../../shared/src/SimuloServerController";
import type SimuloServerPlugin from "../../../../../shared/src/SimuloServerPlugin";
import workerURL from './worker?worker&url';

interface ObjectDiffs {
    [id: number]: {
        [key: string]: any;
    };
}

interface CachedObject {
    [key: string]: any;
}

/** SimuloBrowserScriptSandbox uses Web Workers in sandboxed iframes to run scripts */

export default class SimuloBrowserScriptSandbox implements SimuloServerPlugin {
    name = "Simulo Browser Script Sandbox";
    description = "Secure sandbox for JavaScript in the browser";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-script-sandbox";
    dependencies = [];
    controller: SimuloServerController;

    updatePromise: { resolve: (diffs: ObjectDiffs) => void, reject: () => void } | null = null;
    scriptWorker = new Worker(workerURL, { type: 'module' });

    constructor(controller: SimuloServerController) {
        this.controller = controller;
        this.setupWorker(this.scriptWorker);
    }

    objects: {
        [id: number]: CachedObject;
    } = {
            0: {
                name: 'untitled object'
            },
            5: {
                name: 'test object'
            }
        }

    setupWorker(worker: Worker) {
        worker.onmessage = ({ data }) => {
            let d = data as {
                event: "update" | "physics";
                body: any;
            };

            if (d.event === "update") {
                if (this.updatePromise) {
                    this.updatePromise.resolve(d.body);
                    this.updatePromise = null;
                }
            }
        };
    }

    async runEvent(event: string) {
        this.updatePromise = null;
        let then = window.performance.now();
        let cachedObjects = this.objects;
        let promise = new Promise<ObjectDiffs>((resolve, reject) => {
            this.updatePromise = {
                resolve,
                reject
            };
            this.scriptWorker.postMessage({
                event: event,
                body: {},
                cachedObjects
            });
        });
        let diffs = await promise;
        console.log('diffs', diffs);
        for (let id in diffs) {
            let obj = cachedObjects[id];
            let diff = diffs[id];
            for (let key in diff) {
                obj[key] = diff[key];
            }
        }

        console.log('success in', window.performance.now() - then, 'ms');
    }

    addScript(script: string, id: number) {
        this.scriptWorker.postMessage({
            event: "addScript",
            body: {
                id,
                code: script
            },
            cachedObjects: this.objects
        });
    }

    async start() {
        console.log("start");
        await this.runEvent('start');
    }
    async update() {
        await this.runEvent('update');
    }
    destroy() {
        console.log("destroy");
    }
    handleIncomingEvent(event: string, data: any, id: string): void { }
    handleOutgoingEvent(event: string, data: any, id: string | null): void { }
}