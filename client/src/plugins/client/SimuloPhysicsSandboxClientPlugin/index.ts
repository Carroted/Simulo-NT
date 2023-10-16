import type SimuloClientPlugin from "../../../SimuloClientPlugin";
import type SimuloClientController from "../../../SimuloClientController";
import SimuloViewerPIXI from "../../../SimuloViewerPIXI";
import SimuloViewerTHREE from "../../../SimuloViewerTHREE";
import type WorldUpdate from "../../../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/WorldUpdate";
import type SimuloViewer from "../../../SimuloViewer";
import SimuloViewerCanvas from "../../../SimuloViewerCanvas";

/** This will manage tools and UI for Physics Sandbox client-side */

export default class SimuloPhysicsSandboxClientPlugin implements SimuloClientPlugin {
    name = "Simulo Physics Sandbox Client Plugin";
    description = "The client-side plugin for the Physics Sandbox game";
    version = "0.1.0";
    author = "Carroted";
    namespace = "carroted";
    id = "simulo-physics-sandbox-client-plugin";
    dependencies = [];
    controller: SimuloClientController;
    viewer: SimuloViewer;

    cachedImages: { [url: string]: any } = {}; // can store string for svg for example, or something else for rasters

    async fetchSVG(url: string) {
        if (this.cachedImages[url]) return this.cachedImages[url];
        this.cachedImages[url] = await (await fetch(url)).text();
        return this.cachedImages[url];
    }

    /** Generate a recolored SVG cursor and apply it on the document body. */
    async setColorCursor(image: string, fillColor: string, borderColor?: string) { // in the future, we will have way more kinds of cursors. anyone will be able to create a recolorable cursor
        // the cursor is an svg with some colors to replace to create a custom cursor

        // fetch the svg
        let cursorSVG = await this.fetchSVG(image);

        // if you open that texture you'll see that it's in red and blue
        // by replacing the colors we can change the cursor colors to anything at runtime
        cursorSVG = cursorSVG.replace(/#ff0000/g, fillColor);
        if (!borderColor) {
            cursorSVG = cursorSVG.replace(/#0000ff/g, fillColor === '#000000' ? '#ffffff' : '#000000');
        }
        else {
            cursorSVG = cursorSVG.replace(/#0000ff/g, borderColor);
        }

        // create a data url from the svg
        let cursorDataURL = 'data:image/svg+xml;base64,' + btoa(cursorSVG);

        // set body cursor
        document.body.style.setProperty('cursor', `url("${cursorDataURL}") 6 2, auto`, 'important');
    }

    utilityBar: HTMLDivElement;
    toolBar: HTMLDivElement;
    menuBar: HTMLDivElement;
    paused: boolean = false; // DONT set directly, this is updated when the server tells us it paused or whatever
    pausedIndicator: HTMLDivElement;
    pausePlay: HTMLDivElement;

    togglePaused() {
        this.controller.emit('set_paused', !this.paused);
    }

    constructor(controller: SimuloClientController, viewer: 'pixi' | 'three' | 'canvas') {
        this.controller = controller;
        // this.viewer = new SimuloViewerTHREE();

        if (viewer === 'pixi') {
            this.viewer = new SimuloViewerPIXI();
        }
        else if (viewer === 'canvas') {
            let canvas = document.createElement('canvas');
            this.viewer = new SimuloViewerCanvas(canvas);
        }
        else if (viewer === 'three') {
            this.viewer = new SimuloViewerTHREE() as any;
        }
        else {
            let canvas = document.createElement('canvas');
            this.viewer = new SimuloViewerCanvas(canvas);
        }

        // listen to viewer events and emit them to the server in Physics Sandbox format

        this.viewer.on('pointerdown', (e: { point: { x: number, y: number }, event: any }) => {
            if (e.event.button === 0) {
                console.log('down it goes at', e.point)
                this.controller.emit('player_down', e.point);
            }
        });
        this.viewer.on('pointermove', (e: { point: { x: number, y: number }, event: any }) => {
            this.controller.emit('player_move', e.point);
        });
        this.viewer.on('pointerup', (e: { point: { x: number, y: number }, event: any }) => {
            if (e.event.button === 0) {
                console.log('up it goes')
                this.controller.emit('player_up', e.point);
            }
        });

        let pauseOverlay = document.createElement('div');
        pauseOverlay.className = 'pause-overlay';
        pauseOverlay.id = 'pause-overlay';
        this.fetchSVG('./icons/pause.svg').then((svg) => {
            pauseOverlay.innerHTML = svg;
        });
        this.pausedIndicator = document.body.appendChild(pauseOverlay);

        // spacebar = emit set_paused
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.togglePaused();
            }
            if (e.code === 'Delete') {
                this.controller.emit('player_delete_selection', '');
            }
        });

        let renderLoop = () => {
            this.viewer.render();
            requestAnimationFrame(renderLoop);
        }
        requestAnimationFrame(renderLoop);


        this.setColorCursor('./assets/textures/cursor_new.svg', '#000000');
        // document.body.style.cursor = 'none';

        let utilityBar = document.createElement('div');
        utilityBar.className = 'panel bar utilities';
        utilityBar.style.display = 'none';

        let people = document.createElement('div');
        people.className = 'people item';
        this.fetchSVG('./icons/account-multiple.svg').then((svg) => {
            people.innerHTML = svg;
        });
        // for now it just logs
        people.addEventListener('click', (e) => {
            console.log('people');
        });
        utilityBar.appendChild(people);

        // now for timeline-plus
        let addUndoEntry = document.createElement('div');
        addUndoEntry.className = 'add-undo-entry item';
        this.fetchSVG('./icons/timeline-plus.svg').then((svg) => {
            addUndoEntry.innerHTML = svg;
        });
        // for now it just logs
        addUndoEntry.addEventListener('click', (e) => {
            console.log('add undo entry');
        });
        utilityBar.appendChild(addUndoEntry);

        {
            // .divider
            let divider = document.createElement('div');
            divider.className = 'divider';
            utilityBar.appendChild(divider);
        }

        // ok so now we want undo and redo
        // svgs are arrow-u-left-top and arrow-u-right-top
        let undo = document.createElement('div');
        undo.className = 'undo item';
        this.fetchSVG('./icons/arrow-u-left-top.svg').then((svg) => {
            undo.innerHTML = svg;
        });
        // for now it just logs
        undo.addEventListener('click', (e) => {
            console.log('undo');
        });
        utilityBar.appendChild(undo);

        let pausePlay = document.createElement('div');
        pausePlay.className = 'pause-play item';
        let pauseDiv = document.createElement('div');
        pauseDiv.className = 'pause';
        let playDiv = document.createElement('div');
        playDiv.className = 'play';
        this.fetchSVG('./icons/pause.svg').then((svg) => {
            pauseDiv.innerHTML = svg;
        });
        this.fetchSVG('./icons/play.svg').then((svg) => {
            playDiv.innerHTML = svg;
        });

        pausePlay.appendChild(pauseDiv);
        pausePlay.appendChild(playDiv);
        pausePlay.addEventListener('click', (e) => {
            this.togglePaused();
        });
        this.pausePlay = utilityBar.appendChild(pausePlay);

        let redo = document.createElement('div');
        redo.className = 'redo item';
        this.fetchSVG('./icons/arrow-u-right-top.svg').then((svg) => {
            redo.innerHTML = svg;
        });

        // for now it just logs
        redo.addEventListener('click', (e) => {
            console.log('redo');
        });
        utilityBar.appendChild(redo);

        {
            // .divider
            let divider = document.createElement('div');
            divider.className = 'divider';
            utilityBar.appendChild(divider);
        }

        // earth
        let worldSettings = document.createElement('div');
        worldSettings.className = 'world-settings item';
        this.fetchSVG('./icons/earth.svg').then((svg) => {
            worldSettings.innerHTML = svg;
        });
        // for now it just logs
        worldSettings.addEventListener('click', (e) => {
            console.log('world settings');
        });
        utilityBar.appendChild(worldSettings);

        // grid
        let grid = document.createElement('div');
        grid.className = 'grid item';
        this.fetchSVG('./icons/grid.svg').then((svg) => {
            grid.innerHTML = svg;
        });
        // for now it just logs
        grid.addEventListener('click', (e) => {
            console.log('grid');
        });
        utilityBar.appendChild(grid);

        this.utilityBar = document.body.appendChild(utilityBar);

        let toolBar = document.createElement('div');
        toolBar.className = 'panel bar tools';
        toolBar.style.display = 'none';
        this.toolBar = document.body.appendChild(toolBar);

        let menuBar = document.createElement('div');
        menuBar.className = 'panel bar menus';
        this.menuBar = document.body.appendChild(menuBar);

        // add File (thats it lmao)
        let fileMenu = document.createElement('div');
        fileMenu.className = 'menu';
        fileMenu.innerHTML = 'File';
        this.menuBar.appendChild(fileMenu);

        //@ts-ignore
        window.save = () => {
            this.controller.emit('save', '');
        };

        //@ts-ignore
        window.load = () => {
            this.controller.emit('load', '');
            this.viewer.reset();
        };
    }

    destroy(): void { } // for now, nothing in destroy. in the future, this should properly dispose of everything cleanly

    toolElements: { [id: string]: HTMLDivElement } = {};

    async updateToolBar(toolsLists: ({
        name: string,
        icon: string,
        description: string,
        id: string
    } | null)[][], toolID: string) {
        this.utilityBar.style.display = 'flex';
        this.toolBar.style.display = 'grid';
        this.toolBar.innerHTML = '';
        this.toolElements = {};
        for (let i = 0; i < toolsLists.length; i++) {
            let tools = toolsLists[i];
            // if its not first one, add .divider.horizontal div
            if (i !== 0) {
                let divider = document.createElement('div');
                divider.className = 'divider horizontal';
                // span 2 columns
                divider.style.gridColumn = 'span 2';
                this.toolBar.appendChild(divider);
            }
            for (let tool of tools) {
                if (!tool) {
                    // div
                    let div = document.createElement('div');
                    div.className = 'tool item';
                    this.toolBar.appendChild(div);
                    continue;
                }
                const toolElement = document.createElement('div');
                toolElement.className = toolID === tool.id ? 'tool item active' : 'tool item';
                toolElement.innerHTML = await this.fetchSVG(tool.icon);
                toolElement.addEventListener('click', (e) => {
                    this.controller.emit('player_tool', tool!.id);
                });

                this.toolElements[tool.id] = this.toolBar.appendChild(toolElement);
            }
        }
    }

    handleIncomingEvent(event: string, data: any): void {
        if (event === 'world_update') {
            // the world has updated, let's update the viewer with the new data
            let worldUpdate = data as WorldUpdate;
            this.viewer.update(worldUpdate);
        }
        if (event === 'tools') {
            let tools = data.tools as ({
                name: string,
                icon: string,
                description: string,
                id: string
            } | null)[][];
            let tool = data.tool as string;
            this.updateToolBar(tools, tool);
        }
        if (event === 'player_tool_success') {
            // reset all tools
            Object.keys(this.toolElements).forEach(tool => {
                if (data !== tool) {
                    this.toolElements[tool].classList.remove('active');
                }
                else {
                    this.toolElements[tool].classList.add('active');
                }
            });
        }
        if (event === 'pause_changed') {
            this.paused = data;
            if (this.paused) {
                this.pausedIndicator.style.opacity = '1';
                this.pausePlay.classList.add('paused');
            }
            else {
                this.pausedIndicator.style.opacity = '0';
                this.pausePlay.classList.remove('paused');
            }
        }
    }
    handleOutgoingEvent(event: string, data: any): void { } // nothing here
}