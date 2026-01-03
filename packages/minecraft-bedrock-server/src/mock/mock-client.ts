/**
 * MockBedrockClient - A network-free test client for Bedrock Edition
 *
 * This client bypasses network communication entirely:
 * - Captures outgoing packets via write()/queue() for test assertions
 * - Injects incoming packets via inject() to trigger plugin handlers
 * - Optionally validates packet format via serialize/deserialize round-trip
 */

import { EventEmitter } from "events";
import { createSerializer, createDeserializer } from "bedrock-protocol/src/transforms/serializer.js";
import type {
  MockPacketCapture,
  MockClientOptions,
  AutoResponderHandler,
  AutoResponderResult,
} from "./mock-client-types.ts";

export class MockBedrockClient extends EventEmitter {
  public readonly version: string;
  public readonly sentPackets: MockPacketCapture[] = [];
  public readonly queuedPackets: MockPacketCapture[] = [];

  private serializer: any;
  private deserializer: any;
  private options: MockClientOptions;
  private autoResponders: Map<string, AutoResponderHandler> = new Map();

  // Properties expected by mineflayer loader
  public wait_connect = false;
  public status = 0;

  constructor(options: MockClientOptions = {}) {
    super();
    this.options = options;
    this.version = options.version ?? "1.21.130";

    // Initialize serializer/deserializer for packet validation
    try {
      this.serializer = createSerializer(this.version);
      this.deserializer = createDeserializer(this.version);
      this.serializer.proto.setVariable("ShieldItemID", 387);
      this.deserializer.proto.setVariable("ShieldItemID", 387);
    } catch (e) {
      // Serializers are optional - validation will be skipped if unavailable
      console.warn("[MockBedrockClient] Could not create serializers:", e);
    }
  }

  // ============================================================
  // Core Methods (expected by mineflayer)
  // ============================================================

  /**
   * Captures an outgoing packet (sent immediately in real client).
   */
  write(name: string, params: any): void {
    const normalizedParams = this.options.validatePackets
      ? this.normalizePacket(name, params)
      : params;

    const capture: MockPacketCapture = {
      name,
      params: normalizedParams,
      timestamp: Date.now(),
    };

    this.sentPackets.push(capture);
    this.emit("packetSent", capture);

    // Check for auto-responders
    this.handleAutoResponder(name, params);
  }

  /**
   * Captures an outgoing packet (queued for batching in real client).
   * For mock purposes, behaves same as write().
   */
  queue(name: string, params: any): void {
    const normalizedParams = this.options.validatePackets
      ? this.normalizePacket(name, params)
      : params;

    const capture: MockPacketCapture = {
      name,
      params: normalizedParams,
      timestamp: Date.now(),
    };

    this.queuedPackets.push(capture);
    this.sentPackets.push(capture); // Also track in sentPackets for convenience
    this.emit("packetQueued", capture);

    // Check for auto-responders
    this.handleAutoResponder(name, params);
  }

  /**
   * Ends the mock connection.
   */
  end(reason?: string): void {
    this.emit("end", reason);
  }

  /**
   * Closes the mock connection.
   */
  close(): void {
    this.emit("close");
  }

  // ============================================================
  // Test Injection Methods
  // ============================================================

  /**
   * Injects a packet as if received from the server.
   * This triggers plugin handlers listening for this packet.
   */
  inject(name: string, params: any): void {
    const normalizedParams = this.options.validatePackets
      ? this.normalizePacket(name, params)
      : params;

    this.emit(name, normalizedParams);
  }

  /**
   * Injects a raw packet buffer (for testing raw packet handling).
   */
  injectRaw(buffer: Buffer): void {
    if (!this.deserializer) {
      throw new Error("Cannot inject raw buffer without deserializer");
    }

    const { data } = this.deserializer.parsePacketBuffer(buffer);
    this.emit(data.name, data.params);
  }

  // ============================================================
  // Packet Capture Helpers
  // ============================================================

  /**
   * Gets all captured packets, optionally filtered by name.
   */
  getPackets(name?: string): MockPacketCapture[] {
    if (name) {
      return this.sentPackets.filter((p) => p.name === name);
    }
    return this.sentPackets;
  }

  /**
   * Gets the last captured packet with the given name.
   */
  getLastPacket(name: string): MockPacketCapture | undefined {
    const packets = this.getPackets(name);
    return packets[packets.length - 1];
  }

  /**
   * Clears all captured packets.
   */
  clearPackets(): void {
    this.sentPackets.length = 0;
    this.queuedPackets.length = 0;
  }

  /**
   * Waits for a packet with the given name to be sent.
   */
  waitForPacket(name: string, timeout = 5000): Promise<MockPacketCapture> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off("packetSent", handler);
        reject(new Error(`Timeout waiting for packet: ${name}`));
      }, timeout);

      const handler = (capture: MockPacketCapture) => {
        if (capture.name === name) {
          clearTimeout(timer);
          this.off("packetSent", handler);
          resolve(capture);
        }
      };

      // Check if already captured
      const existing = this.getLastPacket(name);
      if (existing) {
        clearTimeout(timer);
        resolve(existing);
        return;
      }

      this.on("packetSent", handler);
    });
  }

  // ============================================================
  // Packet Validation
  // ============================================================

  /**
   * Validates a packet by serializing and deserializing it.
   * Returns the normalized params if valid.
   */
  validatePacket(
    name: string,
    params: any
  ): { valid: boolean; normalized?: any; error?: Error } {
    try {
      const normalized = this.normalizePacket(name, params);
      return { valid: true, normalized };
    } catch (error) {
      return { valid: false, error: error as Error };
    }
  }

  /**
   * Normalizes packet params via serialize/deserialize round-trip.
   */
  private normalizePacket(name: string, params: any): any {
    if (!this.serializer || !this.deserializer) {
      return params;
    }

    try {
      const buffer = this.serializer.createPacketBuffer({ name, params });
      const parsed = this.deserializer.parsePacketBuffer(buffer);
      return parsed.data.params;
    } catch (error) {
      if (this.options.validatePackets) {
        throw new Error(`Invalid packet ${name}: ${(error as Error).message}`);
      }
      return params;
    }
  }

  // ============================================================
  // Auto-Responders
  // ============================================================

  /**
   * Sets an auto-responder that will be called when a packet is sent.
   * If the responder returns a result, it will be injected as a response.
   */
  setAutoResponder(packetName: string, handler: AutoResponderHandler): void {
    this.autoResponders.set(packetName, handler);
  }

  /**
   * Removes an auto-responder.
   */
  removeAutoResponder(packetName: string): void {
    this.autoResponders.delete(packetName);
  }

  /**
   * Handles auto-responding to a sent packet.
   */
  private handleAutoResponder(name: string, params: any): void {
    const handler = this.autoResponders.get(name);
    if (!handler) return;

    const response = handler(params);
    if (response) {
      // Use setImmediate to allow the current write to complete
      setImmediate(() => this.inject(response.name, response.params));
    }
  }

  // ============================================================
  // Initialization Helpers
  // ============================================================

  /**
   * Injects a successful item_stack_response for the given request.
   */
  injectItemStackResponse(
    requestId: number,
    success: boolean,
    containers: any[] = []
  ): void {
    this.inject("item_stack_response", {
      responses: [
        {
          status: success ? "ok" : "error",
          request_id: requestId,
          containers,
        },
      ],
    });
  }

  /**
   * Injects a container_open packet.
   */
  injectContainerOpen(windowId: number, windowType: string): void {
    this.inject("container_open", {
      window_id: windowId,
      window_type: windowType,
      coordinates: { x: 0, y: 0, z: 0 },
      runtime_entity_id: "-1",
    });
  }

  /**
   * Injects a container_close packet (server confirmation).
   */
  injectContainerClose(windowId: number): void {
    this.inject("container_close", {
      window_id: windowId,
      window_type: "none",
      server: true,
    });
  }
}

/**
 * Creates a MockBedrockClient instance.
 */
export function createMockClient(options?: MockClientOptions): MockBedrockClient {
  return new MockBedrockClient(options);
}
