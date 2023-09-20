/** Represents a player mouse cursor in the physics sandbox. Sent over network to clients. */

export default interface PhysicsSandboxPlayer {
    id: string;
    x: number;
    y: number;
    color: number;
}