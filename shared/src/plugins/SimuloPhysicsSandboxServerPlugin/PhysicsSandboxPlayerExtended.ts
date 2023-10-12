import * as p2 from "p2-es";
import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";

/** Adds selection to cursor */

export default interface PhysicsSandboxPlayerExtended extends PhysicsSandboxPlayer {
    selectedObjects: p2.Body[];
}