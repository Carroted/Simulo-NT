import ShapeTransformData from "../../ShapeTransformData"

export default interface SimuloText {
    text: string,
    transform: ShapeTransformData,
    color: number,
    fontSize: number,
    fontFamily: string,
    align: "left" | "center" | "right",
    baseline: "top" | "middle" | "bottom",
}