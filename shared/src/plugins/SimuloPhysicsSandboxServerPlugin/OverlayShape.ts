import type { ShapeContentData, ShapeTransformData } from "../../SimuloPhysicsServerRapier";

export default interface OverlayShape {
    content: ShapeContentData,
    transform: ShapeTransformData,
}