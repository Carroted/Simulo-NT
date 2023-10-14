export default interface SimuloSpring {
    reference: any;
    destroy(): void;
    setLocalAnchorA(localAnchorA: { x: number, y: number, z: number }): void;
    setLocalAnchorB(localAnchorB: { x: number, y: number, z: number }): void;
}