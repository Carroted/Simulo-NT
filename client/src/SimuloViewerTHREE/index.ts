import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import ShapeContentData, { Ball, Cuboid, Polygon } from '../../../shared/src/ShapeContentData';
import ShapeTransformData from '../../../shared/src/ShapeTransformData';
import type WorldUpdate from "../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/WorldUpdate";
import SimuloViewer from '../SimuloViewer';

/** Renderer in THREE.js for Simulo.
 * 
 * Can be used for both 2.5D (renders 2D scenes without requiring any additional setup) and regular 3D. */

export default class SimuloViewerTHREE implements SimuloViewer {
    canvas: HTMLCanvasElement;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    coll2gfx: Map<string, THREE.Object3D>;

    listeners: { [event: string]: ((data: any) => void)[] } = {};
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) return;
        this.listeners[event].splice(this.listeners[event].indexOf(callback), 1);
    }

    constructor() {
        this.coll2gfx = new Map();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        this.camera.position.y = 50;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        let canvas = document.body.appendChild(this.renderer.domElement);
        this.canvas = canvas;

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const getCursorPos = (e: MouseEvent) => {
            let vec = new THREE.Vector3();
            let pos = new THREE.Vector3();

            vec.set(
                ((e.clientX - canvas.offsetLeft) / canvas.width) * 2 - 1,
                -((e.clientY - canvas.offsetTop) / canvas.height) * 2 + 1,
                0.5);

            vec.unproject(this.camera);

            vec.sub(this.camera.position).normalize();

            let distance = -this.camera.position.z / vec.z;

            pos.copy(this.camera.position).add(vec.multiplyScalar(distance));

            return pos;
        };

        // cylinder in Z axis
        let mouseCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 32), new THREE.MeshPhongMaterial({ color: 0xffffff }));
        mouseCylinder.rotation.x = Math.PI / 2;
        this.scene.add(mouseCylinder);

        window.addEventListener('mousemove', (e) => {
            let pos = getCursorPos(e);

            if (this.listeners['pointermove']) {
                this.listeners['pointermove'].forEach((callback) => callback({
                    event: e,
                    point: { x: pos.x, y: pos.y }
                }));
            }

            mouseCylinder.position.set(pos.x, pos.y, 1.5);
        });

        window.addEventListener('mousedown', (e) => {
            let pos = getCursorPos(e);

            if (this.listeners['pointerdown']) {
                this.listeners['pointerdown'].forEach((callback) => callback({
                    event: e,
                    point: { x: pos.x, y: pos.y }
                }));
            }
        });

        window.addEventListener('mouseup', (e) => {
            let pos = getCursorPos(e);

            if (this.listeners['pointerup']) {
                this.listeners['pointerup'].forEach((callback) => callback({
                    event: e,
                    point: { x: pos.x, y: pos.y }
                }));
            }
        });

        // add a point light at cam
        let light = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(light);
        let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        this.scene.add(directionalLight);

        let controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.2;
        controls.mouseButtons = {
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };

        this.renderer.setAnimationLoop(() => {
            directionalLight.position.copy(this.camera.position);
            // rotation too
            directionalLight.rotation.copy(this.camera.rotation);
            this.renderer.render(this.scene, this.camera);
        });
    }

    lines: THREE.Line[] = [];
    tempObjects: THREE.Object3D[] = [];

    update(worldUpdate: WorldUpdate) {
        for (let key in worldUpdate.delta.shapeContent) {
            let content = worldUpdate.delta.shapeContent[key];
            this.addShape(content);
        }
        this.updatePositions(worldUpdate.delta.shapeTransforms);

        // clear pervious lines
        for (let line of this.lines) {
            this.scene.remove(line);
        }

        this.lines = [];

        // add new lines for each worldUpdate.springs
        for (let spring of worldUpdate.springs) {
            let material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3, depthTest: false });
            const points = [];
            points.push(new THREE.Vector3(spring.pointA.x, spring.pointA.y, 0));
            points.push(new THREE.Vector3(spring.pointB.x, spring.pointB.y, 0));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            let line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.lines.push(line);
        }

        // clear temp objects
        for (let obj of this.tempObjects) {
            this.scene.remove(obj);
        }

        this.tempObjects = [];

        // add new temp objects
        worldUpdate.overlays.shapes.forEach((shape) => {
            let mesh = this.renderShape(shape.content);
            let transform = shape.transform;
            mesh.position.set(transform.x, transform.y, transform.z);
            // only ever rotates around the z axis
            mesh.rotation.z = transform.angle;
            this.scene.add(mesh!);
            this.tempObjects.push(mesh!);
        });
    }

    renderShape(content: ShapeContentData): THREE.Object3D {
        let mesh: THREE.Object3D;
        let material = new THREE.MeshPhongMaterial({ color: content.color, flatShading: true, transparent: true });
        switch (content.type) {
            case "ball":
                let ball = content as Ball;
                mesh = new THREE.Mesh(new THREE.SphereGeometry(ball.radius), material);
                break;
            case "polygon":
                // comng soono!2
                mesh = new THREE.Object3D();
                break;
            case "cuboid":
                let cuboid = content as Cuboid;
                mesh = new THREE.Mesh(new THREE.BoxGeometry(cuboid.width, cuboid.height, cuboid.depth), material);
                break;
            default:
                mesh = new THREE.Object3D();
                break;
        }
        return mesh!;
    }

    addShape(content: ShapeContentData) {
        let mesh = this.renderShape(content);
        this.scene.add(mesh!);
        this.coll2gfx.set(content.id, mesh!);
    }

    updatePositions(transformData: { [id: string]: ShapeTransformData }) {
        Object.keys(transformData).forEach(id => {
            let transform = transformData[id];
            let mesh = this.coll2gfx.get(id);
            if (!mesh) return;
            mesh.position.set(transform.x, transform.y, transform.z);
            // only ever rotates around the z axis
            mesh.rotation.z = transform.angle;
        });
    }
}