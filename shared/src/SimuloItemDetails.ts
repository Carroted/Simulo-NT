/** Base details for all items, like plugins, objects, mods, scenes, etc */
export default interface SimuloItemDetails {
    /** Display name for the item */
    name: string;
    description: string;
    version: string;
    author: string;
    namespace: string;
    id: string;
    dependencies: string[];
    // not dates, so that they play well with JSON
    createdAt?: string;
    updatedAt?: string;
}