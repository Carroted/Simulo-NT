import type SimuloItemDetails from "./SimuloItemDetails";
import type SimuloServerController from "./SimuloServerController";

export default interface SimuloServerPlugin extends SimuloItemDetails {
    /** Assigned in constructor */
    controller?: SimuloServerController;
    /** Called when the method of the same name is called on `ServerController`. You should use constructor for initialization instead of this method. */
    start(): void;
    /** Called when the method of the same name is called on `ServerController`. */
    update(): void;
    /** Called when the plugin is removed or the method of the same name is called on `ServerController`. */
    destroy(): void;
    /** Called when the method of the same name is called on `ServerController`.
     * 
     * For instance, a `NetworkServer` plugin would call `serverController.handleIncomingEvent` when it receives a message from a client. Other plugins can then handle that event with this method.
     * 
     * Should never be used by transport plugins. */
    handleIncomingEvent(event: string, data: any, id: string): void;
    /** Called when `emit` is called on `ServerController`.
     * 
     * For instance, plugins can call `serverController.emit` to send a message to a client, and a `NetworkServer` plugin would handle that message with this method.
     * 
     * Should only be used for transport plugins and logging plugins.
     * 
     * ID should always be present when sending to a specific client, and null when sending to all clients. */
    handleOutgoingEvent(event: string, data: any, id: string | null): void;
}