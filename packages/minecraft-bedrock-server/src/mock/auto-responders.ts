/**
 * Pre-built auto-responder handlers for common test patterns.
 *
 * Usage:
 *   const responders = createAutoResponders();
 *   mockClient.setAutoResponder('interact', responders.inventoryOpen);
 *   mockClient.setAutoResponder('item_stack_request', responders.itemStackApprove);
 */

import type { AutoResponderHandler, AutoResponderResult } from "./mock-client-types.ts";

export interface AutoResponders {
  /** Responds to interact 'open_inventory' with container_open */
  inventoryOpen: AutoResponderHandler;

  /** Approves all item_stack_request with 'ok' status */
  itemStackApprove: AutoResponderHandler;

  /** Confirms container_close requests */
  containerCloseConfirm: AutoResponderHandler;

  /** Echoes text messages back (for chat testing) */
  chatEcho: AutoResponderHandler;
}

/**
 * Creates a set of common auto-responders for testing.
 */
export function createAutoResponders(): AutoResponders {
  return {
    /**
     * Responds to interact 'open_inventory' action with container_open packet.
     */
    inventoryOpen: (params: any): AutoResponderResult | null => {
      if (params.action_id === "open_inventory") {
        return {
          name: "container_open",
          params: {
            window_id: 2,
            window_type: "inventory",
            coordinates: { x: 0, y: 0, z: 0 },
            runtime_entity_id: "-1",
          },
        };
      }
      return null;
    },

    /**
     * Approves all item_stack_request packets with 'ok' status.
     * This is useful for testing inventory operations that don't need
     * detailed response validation.
     */
    itemStackApprove: (params: any): AutoResponderResult => {
      return {
        name: "item_stack_response",
        params: {
          responses: params.requests.map((req: any) => ({
            status: "ok",
            request_id: req.request_id,
            containers: [],
          })),
        },
      };
    },

    /**
     * Confirms container_close requests with server acknowledgment.
     */
    containerCloseConfirm: (params: any): AutoResponderResult => {
      return {
        name: "container_close",
        params: {
          window_id: params.window_id,
          window_type: "none",
          server: true,
        },
      };
    },

    /**
     * Echoes text messages back to the client.
     * Useful for testing chat functionality.
     */
    chatEcho: (params: any): AutoResponderResult => {
      return {
        name: "text",
        params: {
          type: "chat",
          needs_translation: false,
          source_name: params.source_name || "MockServer",
          message: params.message,
          parameters: [],
          xuid: "",
          platform_chat_id: "",
          filtered_message: "",
        },
      };
    },
  };
}

/**
 * Installs all common auto-responders on a mock client.
 */
export function installAllAutoResponders(mockClient: {
  setAutoResponder: (name: string, handler: AutoResponderHandler) => void;
}): void {
  const responders = createAutoResponders();
  mockClient.setAutoResponder("interact", responders.inventoryOpen);
  mockClient.setAutoResponder("item_stack_request", responders.itemStackApprove);
  mockClient.setAutoResponder("container_close", responders.containerCloseConfirm);
  mockClient.setAutoResponder("text", responders.chatEcho);
}
