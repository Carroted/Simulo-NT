import WorldUpdate from "../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/WorldUpdate";

export default interface SimuloViewer {
    canvas: HTMLCanvasElement;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    render(): void;
    /** Clear all objects from the scene and reset the camera. */
    reset(): void;
    /** Updates the current world on the viewer. Does not render. */
    update(worldUpdate: WorldUpdate): void;
}