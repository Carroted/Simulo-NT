import type { ShapeContentData, ShapeTransformData } from "../../SimuloPhysicsServerP2";

export default interface OverlayShape {
    content: ShapeContentData,
    transform: ShapeTransformData,
}