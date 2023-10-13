export default interface BaseShapeData {
    /** If none is provided, one will automatically be generated. If you provide this, it should always be in a container, there's no reason to supply one on root.
     * 
     * Good example of when to supply this: you are loading saved objects within a container.
     * 
     * Bad example of supplying this: you are creating a new object and giving it ID "ground". This is bad usage, IDs should always be like `/0`, `/34/1993`, etc. */
    id?: string;
    name: string | undefined;
    /** Path to a sound file for collisions. Relative to /assets/sounds/ */
    sound: string | null;
    /** Color number like 0xffffff */
    color: number;
    /** 0-1 alpha */
    alpha: number;
    /** Color number or null for no border */
    border: number | null;
    borderWidth: number | null;
    borderScaleWithZoom: boolean;
    image: string | null;
    /** We sort shapes with this for almost everything, including rendering. Newer shapes get a higher Z Depth. At the start of a scene, IDs and Z Depths will be the same, but user interaction can change this. */
    zDepth: number;
    flipImage?: boolean;
    position: { x: number, y: number },
    isStatic: boolean,
    friction: number,
    restitution: number,
    density: number,
}