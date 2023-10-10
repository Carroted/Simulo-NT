import type RAPIER from "@dimforge/rapier2d-compat";
import type PhysicsSandboxPlayer from "./PhysicsSandboxPlayer";

/** Adds selection to cursor */

export default interface PhysicsSandboxPlayerExtended extends PhysicsSandboxPlayer {
    selectedObjects: RAPIER.Collider[];
}