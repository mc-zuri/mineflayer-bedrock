/**
 * Types for MockBedrockClient - a network-free test client
 */

export interface MockPacketCapture {
  name: string;
  params: any;
  timestamp: number;
}

export interface MockClientOptions {
  /** Minecraft version (default: '1.21.130') */
  version?: string;
  /** Enable packet validation via serialize/deserialize round-trip */
  validatePackets?: boolean;
}

export interface AutoResponderResult {
  name: string;
  params: any;
}

export type AutoResponderHandler = (params: any) => AutoResponderResult | null | undefined;
