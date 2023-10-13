import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";
import SimuloObject from "../../SimuloObject";

/** Adds selection to cursor */

export default interface PhysicsSandboxPlayerExtended extends PhysicsSandboxPlayer {
    selectedObjects: SimuloObject[];
}