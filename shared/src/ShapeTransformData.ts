/** Translation and rotation to apply to a shape. Scale is not included in this (and is instead in `ShapeContentData`) since it rarely changes, unlike position and rotation, which usually change every frame. */
export default interface ShapeTransformData {
    x: number;
    y: number;
    z: number;
    angle: number;
}