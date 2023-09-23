import hsvToHex from "./hsvToHex";

/** Random hex number like `0xffffff` */
function randomColor(hueMin: number = 0, hueMax: number = 1, saturationMin: number = 0.5, saturationMax: number = 0.8, valueMin: number = 0.8, valueMax: number = 1): number {
    let hue = hueMin + Math.random() * (hueMax - hueMin);
    let saturation = saturationMin + Math.random() * (saturationMax - saturationMin);
    let value = valueMin + Math.random() * (valueMax - valueMin);
    return hsvToHex(hue, saturation, value);
}

export default randomColor;