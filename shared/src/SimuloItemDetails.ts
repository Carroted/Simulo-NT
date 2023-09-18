// base details for all items, like plugins, objects, mods, scenes, etc
export default interface SimuloItemDetails {
    name: string;
    description: string;
    version: string;
    author: string;
    namespace: string;
    id: string;
    dependencies: string[];
    // not a date so that it plays well with JSON
    createdAt?: string;
    updatedAt?: string;
}