import mcData from "minecraft-data";
import mcRegistry, { type Registry } from "prismarine-registry";
import mcChunk, { type PCChunk } from "prismarine-chunk";
import mcBlock, { type Block } from "prismarine-block";
import mcWorld from "prismarine-world";
import type { World } from "prismarine-world/types/world.js";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

let mcChunkLoader = mcChunk as any as (mcVersionOrRegistry: string | Registry) => typeof PCChunk;
let mcWorldLoader = mcWorld as any as (mcVersion: string) => typeof World;

export class BlockConverter {
  javaMcData: mcData.IndexedData;
  javaRegistry: Registry;
  JavaChunkColumn: typeof mcChunk.PCChunk;
  Block: typeof Block;
  javaWorld: mcWorld.world.World;
  bot: Bot;
  javaVersion: string;

  constructor(javaVersion: string, bot: Bot) {
    this.javaVersion = javaVersion;
    this.javaMcData = mcData(javaVersion);
    this.javaRegistry = mcRegistry(javaVersion);
    this.JavaChunkColumn = mcChunkLoader(this.javaRegistry);
    const javaWorldContructor = mcWorldLoader(javaVersion);
    this.javaWorld = new javaWorldContructor(undefined, null, 0);
    this.Block = mcBlock(this.javaRegistry);
    this.bot = bot;
  }

  getJavaStateIdAt(pos: Vec3) {
    const bedrockStateId = this.bot.world.getBlockStateId(pos);
    let bedrockBlock = this.bot.registry.blocksByStateId[bedrockStateId]!;
    let javaState = this.javaMcData.blocksByName[bedrockBlock?.name!];
    if (!javaState) {
      return 0;
    } else if (bedrockBlock.defaultState === bedrockBlock.stateId) {
      return javaState.defaultState;
    } else {
      return javaState.defaultState;
    }
  }

  getJavaBlockByBedrockId(bedrockStateId: number) {
    const stateId = this.getJavaStateId(bedrockStateId);
    const block = this.Block.fromStateId(stateId, 0);
    return block;
  }

  getJavaStateId(bedrockStateId: number) {
    let bedrockBlock = this.bot.registry.blocksByStateId[bedrockStateId]!;
    let javaState = this.javaMcData.blocksByName[bedrockBlock?.name!];
    if (!javaState) {
      return 0;
    } else if (bedrockBlock.defaultState === bedrockBlock.stateId) {
      return javaState.defaultState;
    } else {
      return javaState.defaultState;
    }
  }

  convertColumn(column: mcWorld.world.Chunk) {
    const chunk = new this.JavaChunkColumn({});
    for (let y = -64; y < 225; y++) {
      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          const posInChunk = new Vec3(x, y, z);
          let bedrockStateId = column.getBlockStateId(posInChunk);
          if (bedrockStateId != null) {
            let javaStateId = this.getJavaStateId(bedrockStateId);
            chunk.setBlockStateId(posInChunk, javaStateId);
          }
        }
      }
    }
    return chunk;
  }
}
