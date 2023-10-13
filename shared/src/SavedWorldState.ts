import SimuloObjectData from "./SimuloObjectData";

export default interface SavedWorldState {
    state: number[];
    userDatas: { [handle: number]: SimuloObjectData };
    currentIDs: { [container: string]: number };
    springs: {
        bodyA: string | null;
        bodyB: string | null;
        localAnchorA: { x: number, y: number };
        localAnchorB: { x: number, y: number };
        stiffness: number;
        damping: number;
        targetLength: number;
        id: string;
    }[];
}