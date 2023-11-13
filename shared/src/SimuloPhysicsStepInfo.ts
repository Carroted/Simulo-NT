import CollisionSound from "./CollisionSound";
import ShapeContentData from "./ShapeContentData";
import { ShapeTransformData } from "./SimuloPhysicsServerRapier2D";
import SimuloSpringInfo from "./SimuloSpringInfo";

export default interface SimuloPhysicsStepInfo {
    delta: {
        /** Shape content that has changed since last step. */
        shapeContent: { [id: string]: ShapeContentData };

        /** New positioning and rotation of shape contents. */
        shapeTransforms: { [id: string]: ShapeTransformData };

        /** IDs of shape contents that are no more. */
        removedContents: string[];
    };

    ms: number;

    springs: SimuloSpringInfo[];

    sounds: CollisionSound[];
}
