declare module 'poly-decomp' {
    function makeCCW(vertices: number[][]): number[][];
    function quickDecomp(vertices: number[][]): number[][][];
    function decomp(vertices: number[][]): number[][][];
    function isSimple(vertices: number[][]): boolean;
    function removeCollinearPoints(vertices: number[][], thresholdAngle: number): void;
    function removeDuplicatePoints(vertices: number[][], precision: number): void;
}