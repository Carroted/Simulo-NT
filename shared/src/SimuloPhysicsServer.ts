import BaseShapeData from "./BaseShapeData";
import CollisionSound from "./CollisionSound";
import SavedWorldState from "./SavedWorldState";
import ShapeContentData from "./ShapeContentData";
import ShapeTransformData from "./ShapeTransformData";
import SimuloObject from "./SimuloObject";
import SimuloObjectData from "./SimuloObjectData";
import SimuloPhysicsStepInfo from "./SimuloPhysicsStepInfo";
import SimuloSpring from "./SimuloSpring";

export default interface SimuloPhysicsServer {
    type: "2d" | "3d";
    /** Steps the world, then returns step from `getStepInfo`. */
    step(): SimuloPhysicsStepInfo;
    getStepInfo(sounds: CollisionSound[], before: number): SimuloPhysicsStepInfo;
    getShapeTransforms(): { [id: string]: ShapeTransformData };
    destroyObject(object: SimuloObject): void;
    addPolygon?(polygon: BaseShapeData & {
        points: { x: number, y: number }[];
    }): SimuloObject;
    getShapeContent(reference: any): ShapeContentData | null;
    getObjectAtPoint(point: { x: number, y: number, z: number }): SimuloObject | null;
    getObjectsAtPoint(point: { x: number, y: number, z: number }): SimuloObject[];
    getObjectsInCuboid(startPoint: { x: number, y: number, z: number }, endPoint: { x: number, y: number, z: number }): SimuloObject[];
    addBall(ball: BaseShapeData & {
        radius: number;
        cakeSlice: boolean;
    }): SimuloObject;
    addCuboid(cuboid: BaseShapeData & {
        width: number;
        height: number;
        depth: number;
    }): SimuloObject;
    addPlane?(plane: BaseShapeData): SimuloObject;
    addSpring(spring: {
        objectA: SimuloObject | null; // null means world
        objectB: SimuloObject | null; // null means world
        stiffness: number;
        damping: number;
        restLength: number;
        localAnchorA: { x: number, y: number, z: number };
        localAnchorB: { x: number, y: number, z: number };
    }): SimuloSpring;
    removeSpring(spring: SimuloSpring): void;
    getLocalObjectPoint(object: SimuloObject, worldPoint: { x: number, y: number, z: number }): { x: number, y: number, z: number };
    getWorldObjectPoint(object: SimuloObject, localPoint: { x: number, y: number, z: number }): { x: number, y: number, z: number };
    getObjectData(object: SimuloObject): SimuloObjectData | null;
    getObjectByID(id: string): SimuloObject | null;
    saveScene(): SavedWorldState;
    getSimuloObject(reference: any): SimuloObject | null;
    addAxle(axle: {
        bodyA: SimuloObject;
        bodyB: SimuloObject;
        localAnchorA: { x: number, y: number, z: number };
        localAnchorB: { x: number, y: number, z: number };
    }): any;
    addSpring(spring: {
        objectA: SimuloObject | null; // null means world
        objectB: SimuloObject | null; // null means world
        stiffness: number;
        damping: number;
        restLength: number;
        localAnchorA: { x: number, y: number, z: number };
        localAnchorB: { x: number, y: number, z: number };
    }): any;

    /** Responsibly shut down the physics server. */
    destroy(): void;
}