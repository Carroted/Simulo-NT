export default interface ShapeContentData {
    id: string;
    name: string;
    description: string | null;
    type: "cuboid" | "ball" | "polygon" | "line" | "plane";
    color: number;
    /** 0-1 alpha */
    alpha: number;
    border: number | null;
    borderWidth: number | null;
}

interface Polygon extends ShapeContentData {
    type: "polygon";
    points: [x: number, y: number][];
}

interface Cuboid extends ShapeContentData {
    type: "cuboid";
    width: number;
    height: number;
    depth: number;
}

interface Ball extends ShapeContentData {
    type: "ball";
    radius: number;
    cakeSlice: boolean;
}

interface Plane extends ShapeContentData { // points up, infinite at bottom, position is on the surface of plane
    type: "plane";
}

export { Polygon, Cuboid, Ball, Plane };