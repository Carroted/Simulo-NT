import ShapeContentData from "../../ShapeContentData";
import SimuloPhysicsStepInfo from "../../SimuloPhysicsStepInfo";
import type OverlayShape from "./OverlayShape";
import type SimuloText from "./SimuloText";

export default interface WorldUpdate extends SimuloPhysicsStepInfo {
    overlays: {
        shapes: OverlayShape[],
        texts: SimuloText[]
    }
    selectedObjects: { [id: string]: ShapeContentData[] }
};