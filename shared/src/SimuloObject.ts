export default interface SimuloObject {
    id: string;
    reference: any;
    destroy(): void;
}