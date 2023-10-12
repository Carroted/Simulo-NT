// module 'polygon-splitter' is a function itself

declare function polygonSplitter(polygon: {
    type: "Polygon";
    coordinates: number[][] | number[][][];
}, polyline: {
    type: "LineString";
    coordinates: number[][];
}): any;

declare module 'polygon-splitter' {
    export = polygonSplitter;
}