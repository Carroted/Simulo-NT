import type { ShapeContentData, SimuloPhysicsStepInfo } from "../../SimuloPhysicsServerP2"
import type OverlayShape from "./OverlayShape"
import type OverlayText from "./OverlayText"

export default interface WorldUpdate extends SimuloPhysicsStepInfo {
    overlays: {
        shapes: OverlayShape[],
        texts: OverlayText[]
    }
    selectedObjects: { [id: string]: ShapeContentData[] }
};