export default function getParabola(p1: [number, number], p2: [number, number], p3: [number, number]): (x: number) => number {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const A = ((y2 - y1) * (x3 - x2) - (y3 - y2) * (x2 - x1)) / ((x2 * x2 - x1 * x1) * (x3 - x2) - (x3 * x3 - x2 * x2) * (x2 - x1));
    const B = (y2 - y1 - A * (x2 * x2 - x1 * x1)) / (x2 - x1);
    const C = y1 - A * x1 * x1 - B * x1;

    return (x: number) => A * x * x + B * x + C;
}