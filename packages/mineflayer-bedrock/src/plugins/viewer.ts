import type { Bot, BotOptions } from 'mineflayer';
import { Vec3 } from 'vec3';
import mcData from 'minecraft-data';
import mcWorld from 'prismarine-world';
import mcBlock, { type Block } from 'prismarine-block';
import mcRegistry, { type Registry } from 'prismarine-registry';
import mcChunk, { type PCChunk } from 'prismarine-chunk';
import prismarineViewer from 'prismarine-viewer';
import type { World } from 'prismarine-world/types/world.js';

let mcChunkLoader = mcChunk as any as (mcVersionOrRegistry: string | Registry) => typeof PCChunk;
let mcWorldLoader = mcWorld as any as (mcVersion: string) => typeof World;
let mcBlockLoader = mcBlock as any as (mcVersion: string) => typeof Block;

const javaVersion = '1.21.8';

export function viewerPlugin(bot: Bot, options: BotOptions) {
  // workaroud for bingint serialization in socket.io
  (BigInt as any).prototype.toJSON = function () {
    return this.toString();
  };

  const proxy = createProxy(bot);
  prismarineViewer.mineflayer(proxy, {
    port: 3000,
    firstPerson: false,
    viewDistance: 3,
  });

  bot.on('path_update', (r) => {
    const nodesPerTick = ((r.visitedNodes * 50) / r.time).toFixed(2);
    //console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${nodesPerTick} nodes/tick). ${r.status}`)
    const path = [bot.entity.position.offset(0, 0.5, 0)];
    for (const node of r.path) {
      path.push(new Vec3(node.x, node.y + 0.5, node.z));
    }
    bot.viewer.drawLine('path', path, 0xff00ff);
  });

  bot.on('path_reset', () => {
    bot.viewer.erase('path');
  });

  bot.on('goal_reached', () => {
    bot.viewer.erase('path');
  });
}

function createProxy(bot: Bot): Bot {
  const javaMcData = mcData(javaVersion);
  const javaRegistry = mcRegistry(javaVersion);
  const JavaChunkColumn = mcChunkLoader(javaRegistry);
  const javaWorldContructor = mcWorldLoader(javaVersion);
  const javaBlockContructor = mcBlock(javaRegistry);
  const javaWorld = new javaWorldContructor((x, z) => worldGenerator(x, z, JavaChunkColumn, bot, javaMcData, javaBlockContructor), null, 0);

  bot.world.on('chunkColumnLoad', (pos) => {
    javaWorld.emit('chunkColumnLoad', pos);
  });

  bot.world.on('blockUpdate', async ({ position }, blockUpdate2) => {
    let bedrockBlock2 = bot.world.getBlock(new Vec3(position.x, position.y, position.z));
    const javaBlock = tryGetJavaBlock(bedrockBlock2, (bot as any).world, new Vec3(position.x, position.y, position.z), javaMcData, javaBlockContructor);

    await javaWorld.setBlockStateId(position, javaBlock?.stateId ?? b2j[blockUpdate2!.stateId]!);
  });

  return new Proxy(bot, {
    get(target, prop, receiver) {
      if (prop === 'world') {
        return javaWorld;
      } else if (prop === 'registry') {
        return javaRegistry;
      } else if (prop === 'version') {
        return javaVersion;
      }

      return target[prop] || Reflect.get(target, prop, receiver);
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    },
  });
}

function worldGenerator(chunkX, chunkZ, JavaChunkColumn, bot, javaMcData, javaBlockContructor) {
  const chunk = new JavaChunkColumn({});
  for (let y = -64; y < 225; y++) {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const posInChunk = new Vec3(x, y, z);
        const pos = new Vec3(chunkX * 16 + x, y, chunkZ * 16 + z);

        let bedrockBlock = bot.world.getBlock(pos);

        if (bedrockBlock?.stateId) {
          const key = bedrockBlock.stateId.toString() as unknown as any as keyof typeof b2j;
          let javaStateId = b2j[key]! as number | null;

          if (javaStateId != null) {
            if (bedrockBlock.name.endsWith('_stairs')) {
              const javaBlock = tryGetJavaBlock(bedrockBlock, bot.world, pos, javaMcData, javaBlockContructor);
              if (javaBlock) {
                chunk.setBlockStateId(posInChunk, javaBlock.stateId);
              } else {
                // Fallback to b2j mapping if block ID not found
                chunk.setBlockStateId(posInChunk, javaStateId);
              }
            } else {
              chunk.setBlockStateId(posInChunk, javaStateId);
            }
          } else {
            chunk.setBlockStateId(posInChunk, 0);
          }
        }
      }
    }
  }
  return chunk;
}

function tryGetJavaBlock(bedrockBlock: any, bedrockWorld: World, pos: Vec3, javaMcData: any, javaBlockContructor): Block | undefined {
  // Extract Bedrock properties
  const weirdo_direction = bedrockBlock._properties.weirdo_direction;
  const upside_down_bit = bedrockBlock._properties.upside_down_bit || 0;

  // Map to Java properties
  const facing = getStairFacing(weirdo_direction);
  const half = getStairHalf(upside_down_bit);

  // Get neighboring blocks for shape calculation
  const neighbors = {
    north: bedrockWorld.getBlock(pos.offset(0, 0, -1)),
    south: bedrockWorld.getBlock(pos.offset(0, 0, 1)),
    east: bedrockWorld.getBlock(pos.offset(1, 0, 0)),
    west: bedrockWorld.getBlock(pos.offset(-1, 0, 0)),
  };

  const shape = calculateStairShape(bedrockBlock, neighbors);

  // Get Java block ID from the block name
  const blockId = javaMcData.blocksByName[bedrockBlock.name]?.id;

  if (blockId) {
    const javaBlock = javaBlockContructor.fromProperties(blockId, {
      facing,
      half,
      shape,
      waterlogged: 'false',
    });
    return javaBlock;
  }
}

// Helper: Map Bedrock weirdo_direction to Java facing
function getStairFacing(weirdo_direction: number): string {
  const facingMap = {
    0: 'east',
    1: 'west',
    2: 'south',
    3: 'north',
  };
  return facingMap[weirdo_direction] || 'north';
}

// Helper: Map Bedrock upside_down_bit to Java half
function getStairHalf(upside_down_bit: number): string {
  return upside_down_bit === 1 ? 'top' : 'bottom';
}

// Helper: Get 90° clockwise rotation
// Rotation: east(0) → south(2) → west(1) → north(3) → east(0)
function rotateClockwise(direction: number): number {
  const rotations = { 0: 2, 2: 1, 1: 3, 3: 0 };
  return rotations[direction] ?? direction;
}

// Helper: Get 90° counter-clockwise rotation
// Rotation: east(0) → north(3) → west(1) → south(2) → east(0)
function rotateCounterClockwise(direction: number): number {
  const rotations = { 0: 3, 3: 1, 1: 2, 2: 0 };
  return rotations[direction] ?? direction;
}

// Helper: Calculate Java stair shape based on neighbors
function calculateStairShape(bedrockBlock: any, neighbors: { north: any; south: any; east: any; west: any }): string {
  const weirdo_direction = bedrockBlock._properties.weirdo_direction;
  const upside_down_bit = bedrockBlock._properties.upside_down_bit || 0;

  const { north, south, east, west } = neighbors;

  // Check if neighbor is a stairs block with matching half (same upside_down_bit)
  const isMatchingStairs = (neighbor: any) => neighbor?.name.endsWith('_stairs') && (neighbor._properties.upside_down_bit || 0) === upside_down_bit;

  // Get relative directions based on current stair facing
  const getRelativeNeighbors = () => {
    switch (weirdo_direction) {
      case 0: // facing east
        return {
          left: north,
          right: south,
          front: east,
          back: west,
        };
      case 1: // facing west
        return {
          left: south,
          right: north,
          front: west,
          back: east,
        };
      case 2: // facing south
        return {
          left: east,
          right: west,
          front: south,
          back: north,
        };
      case 3: // facing north
        return {
          left: west,
          right: east,
          front: north,
          back: south,
        };
      default:
        return { left: null, right: null, front: null, back: null };
    }
  };

  const relative = getRelativeNeighbors();

  const leftIsStairs = isMatchingStairs(relative.left);
  const rightIsStairs = isMatchingStairs(relative.right);
  const frontIsStairs = isMatchingStairs(relative.front);
  const backIsStairs = isMatchingStairs(relative.back);

  // Get neighbor directions
  const leftDir = leftIsStairs ? relative.left._properties.weirdo_direction : null;
  const rightDir = rightIsStairs ? relative.right._properties.weirdo_direction : null;
  const frontDir = frontIsStairs ? relative.front._properties.weirdo_direction : null;
  const backDir = backIsStairs ? relative.back._properties.weirdo_direction : null;

  const cwRotation = rotateClockwise(weirdo_direction);
  const ccwRotation = rotateCounterClockwise(weirdo_direction);

  // Front perpendicular neighbors always form corners
  // When front turns clockwise, the corner is on the RIGHT
  if (frontDir === cwRotation) {
    return 'outer_right';
  }
  // When front turns counter-clockwise, the corner is on the LEFT
  if (frontDir === ccwRotation) {
    return 'outer_left';
  }

  // Left/right perpendicular neighbors only form corners if the opposite side is NOT continuing
  // outer_left: left neighbor faces 90° CW, AND right is NOT same direction
  if (leftDir === cwRotation && rightDir !== weirdo_direction) {
    return 'outer_left';
  }
  // outer_right: right neighbor faces 90° CCW, AND left is NOT same direction
  if (rightDir === ccwRotation && leftDir !== weirdo_direction) {
    return 'outer_right';
  }

  // Inner corners (only from left/right, not front, and only if opposite is not continuing)
  if (leftDir === ccwRotation && rightDir !== weirdo_direction) {
    return 'inner_right';
  }
  if (rightDir === cwRotation && leftDir !== weirdo_direction) {
    return 'inner_left';
  }

  // Default: straight stair
  return 'straight';
}
