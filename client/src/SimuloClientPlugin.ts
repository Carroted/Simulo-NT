import type SimuloItemDetails from "../../shared/src/SimuloItemDetails";
import type SimuloClientController from "./SimuloClientController";

export default interface SimuloClientPlugin extends SimuloItemDetails {
    /** Assigned in constructor */
    controller?: SimuloClientController;
    /** Called when the plugin is removed or the method of the same name is called on `ClientController`. */
    destroy(): void;
    /** Called when the method of the same name is called on `ClientController`.
     * 
     * For instance, a `NetworkClient` plugin would call `clientController.handleIncomingEvent` when it receives a message from the server. Other plugins can then handle that event with this method.
     * 
     * Should never be used by transport plugins. */
    handleIncomingEvent(event: string, data: any): void;
    /** Called when `emit` is called on `ClientController`.
     * 
     * For instance, plugins can call `clientController.emit` to send a message to the server, and a `NetworkClient` plugin would handle that message with this method.
     * 
     * Should only be used for transport plugins and logging plugins. */
    handleOutgoingEvent(event: string, data: any): void;
}