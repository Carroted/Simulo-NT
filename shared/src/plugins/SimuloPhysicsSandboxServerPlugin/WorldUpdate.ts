import type { SimuloPhysicsStepInfo } from "../../SimuloPhysicsServerRapier"
import type OverlayShape from "./OverlayShape"
import type OverlayText from "./OverlayText"

export default interface WorldUpdate extends SimuloPhysicsStepInfo {
    overlays: {
        shapes: OverlayShape[],
        texts: OverlayText[]
    }
};