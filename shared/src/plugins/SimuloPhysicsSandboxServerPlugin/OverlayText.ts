import type { ShapeTransformData } from "../../SimuloPhysicsServerP2";

export default interface OverlayText {
    text: string,
    transform: ShapeTransformData,
    color: number,
    size: number,
    font: string
}