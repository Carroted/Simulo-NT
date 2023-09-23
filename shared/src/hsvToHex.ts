/** HSV (0-1) to hex number like `0xffffff` */
function hsvToHex(h: number, s: number, v: number): number {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
    }
    r = r ?? 0.5;
    g = g ?? 0.5;
    b = b ?? 0.5;
    return parseInt(
        "0x" +
        Math.floor(r * 255).toString(16) +
        Math.floor(g * 255).toString(16) +
        Math.floor(b * 255).toString(16)
    );
}

export default hsvToHex;