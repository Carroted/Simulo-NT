console.log('starting worker');

interface ObjectDiffs {
    [id: number]: {
        [key: string]: any;
    };
}

interface CachedObject {
    [key: string]: any;
}

/** never modify this directly or unintended behaviour will occur */
let ___objectDiffs: ObjectDiffs = {};
let ___cachedObjects: {
    [id: number]: CachedObject;
} = {};

class CachedSimuloObject {
    readonly id: number;

    constructor(id: number) {
        this.id = id;
    }

    getProperty(key: string) {
        if (___cachedObjects[this.id]) {
            return ___cachedObjects[this.id][key];
        }
        throw new Error('Object does not exist');
    }

    setProperty(key: string, value: any) {
        if (___cachedObjects[this.id]) {
            ___cachedObjects[this.id][key] = value;
            if (!___objectDiffs[this.id]) {
                ___objectDiffs[this.id] = {};
            }
            ___objectDiffs[this.id][key] = value;
            return;
        }
        throw new Error('Object does not exist');
    }

    get name() {
        return this.getProperty('name');
    }

    set name(value: string) {
        this.setProperty('name', value);
    }
}

onmessage = async ({ data }) => {
    ___objectDiffs = {};

    let d = data as {
        event: "update" | "start" | "addScript"
        body: any;
        cachedObjects: {
            [id: number]: CachedObject;
        };
    };

    ___cachedObjects = d.cachedObjects;

    if (d.event === "start") {
        runStarts();
    }
    else if (d.event === "update") {
        runUpdates();
    }
    else if (d.event === "addScript") {
        addScript(d.body.id, d.body.code);
    }

    postMessage({
        event: "update",
        body: ___objectDiffs
    });
};


const functionStore: {
    [objectID: number]: {
        onStart: Function | null;
        onUpdate: Function | null;
    };
} = {};

function addScript(id: number, code: string) {
    const footer = `\n\n// SIMULO SCRIPT FOOTER
return {
    onStart: (typeof onStart === 'function') ? onStart : null,
    onUpdate: (typeof onUpdate === 'function') ? onUpdate : null
};
// END SIMULO SCRIPT FOOTER`;

    const script = code + footer;
    let object = new CachedSimuloObject(id);
    try {
        // create fn and run with object as this
        const fn = new Function(script).call(object);
        // make sure its an object and got us what we wanted
        if (typeof fn === 'object' && fn !== null) {
            functionStore[id] = {
                onStart: (typeof fn.onStart === 'function') ? fn.onStart : null,
                onUpdate: (typeof fn.onUpdate === 'function') ? fn.onUpdate : null
            };
        }
    }
    catch (e) {
        console.error(e);
    }
    console.log('added script', id);
}

function runUpdates() {
    for (let id in functionStore) {
        let obj = new CachedSimuloObject(parseInt(id));
        let fn = functionStore[id];
        if (fn.onUpdate) {
            console.log('running update for', id);
            fn.onUpdate.call(obj); // within code, 'this' will be the object
        }
        else {
            console.log('no update for', id);
        }
    }
}

function runStarts() {
    for (let id in functionStore) {
        let obj = new CachedSimuloObject(parseInt(id));
        let fn = functionStore[id];
        if (fn.onStart) {
            fn.onStart.call(obj); // within code, 'this' will be the object
        }
    }
}

let test = './worker.j'
export default test;