import type { ShapeTransformData } from "../../SimuloPhysicsServerRapier";

export default interface OverlayText {
    text: string,
    transform: ShapeTransformData,
    color: number,
    size: number,
    font: string
}