/**
 * Shared Bedrock protocol types for all packages.
 *
 * Usage in package tsconfig.json:
 *   "extends": "../../tsconfig.base.json"
 *   (types will be included automatically)
 */

/// <reference path="../packages/mineflayer/bedrock-types.d.ts" />

declare module 'bedrock-protocol/src/transforms/serializer.js' {
  export function createDeserializer(version: string): BedrockProtocolDeserializer;

  export interface BedrockProtocolDeserializer {
    parsePacketBuffer(buffer: Buffer): { data: DeserializedPacket };
    proto: {
      setVariable(name: 'ShieldItemID', id: number): void;
    };
  }
}

/** Result of parsePacketBuffer - simpler structure */
type DeserializedPacket<K extends keyof PacketParamsMap = keyof PacketParamsMap> = K extends any
  ? {
      name: K;
      params: PacketParamsMap[K];
    }
  : never;

declare module 'bedrock-protocol' {
  interface Player {
    on(name: 'serverbound', cb: (name: string, des: PacketData) => void): unknown;
    on(name: 'clientbound', cb: (name: string, des: PacketData) => void): unknown;
  }
}

type PacketParamsMap = {
  [K in keyof protocolTypes.BedrockPacketEventMap]: protocolTypes.BedrockPacketEventMap[K] extends (packet: infer P) => void ? P : never;
};

type PacketData<K extends keyof PacketParamsMap = keyof PacketParamsMap> = K extends any
  ? {
      name: K;
      buffer: Buffer;
      fullBuffer: Buffer;
      data: {
        name: K;
        params: PacketParamsMap[K];
      };
    }
  : never;
