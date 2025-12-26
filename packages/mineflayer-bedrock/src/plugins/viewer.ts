import type { Bot, BotOptions } from "mineflayer";
import { Vec3 } from 'vec3'
import mcData from 'minecraft-data';
import mcWorld from 'prismarine-world';
import mcRegistry, { type Registry } from 'prismarine-registry';
import mcChunk, { type PCChunk } from 'prismarine-chunk';
import prismarineViewer from 'prismarine-viewer';
import type { World } from "prismarine-world/types/world.js";

let mcChunkLoader = mcChunk as any as (mcVersionOrRegistry: string | Registry) => typeof PCChunk;
let mcWorldLoader = mcWorld as any as (mcVersion: string) => typeof World;

export function viewerPlugin(bot: Bot, options: BotOptions) {
    // workaroud for bingint serialization in socket.io
    (BigInt as any).prototype.toJSON = function () {
        return this.toString();
    };

    const proxy = createProxy(bot);
    prismarineViewer.mineflayer(proxy, { port: 3000, firstPerson: false, viewDistance: 3, });

    bot.on('path_update', (r) => {
        const nodesPerTick = (r.visitedNodes * 50 / r.time).toFixed(2)
        //console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${nodesPerTick} nodes/tick). ${r.status}`)
        const path = [bot.entity.position.offset(0, 0.5, 0)]
        for (const node of r.path) {
            path.push(new Vec3(node.x, node.y + 0.5, node.z))
        }
        bot.viewer.drawLine('path', path, 0xff00ff)
    });

    bot.on('path_reset', () => {
        bot.viewer.erase('path')
    });

    bot.on('goal_reached', () => {
        bot.viewer.erase('path')
    });
}

function createProxy(bot: Bot): Bot {
    const javaMcData = mcData("1.21.11");
    const javaRegistry = mcRegistry("1.21.11");
    const JavaChunkColumn = mcChunkLoader(javaRegistry);
    const javaWorldContructor = mcWorldLoader("1.21.11");
    const javaWorld = new javaWorldContructor((x, z) => worldGenerator(x, z, JavaChunkColumn, bot, javaMcData), null, 0);

    return new Proxy(bot, {
        get(target, prop, receiver) {
            if (prop === "world") {
                return javaWorld;
            } else if (prop === "registry") {
                return javaRegistry;
            } else if (prop === "version") {
                return "1.21.11";
            }

            return target[prop] || Reflect.get(target, prop, receiver);
        },
        set(obj, prop, value) {
            obj[prop] = value;
            return true;
        },
    });
}

function worldGenerator(chunkX, chunkZ, JavaChunkColumn, bot, javaMcData) {
    const chunk = new JavaChunkColumn({});
    for (let y = -64; y < 225; y++) {
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const posInChunk = new Vec3(x, y, z);
                const pos = new Vec3(chunkX * 16 + x, y, chunkZ * 16 + z);
                let bedrockStateId = bot.world.getBlockStateId(pos);
                let bedrockBlock = bot.registry.blocksByStateId[bedrockStateId];
                let javaState = javaMcData.blocksByName[bedrockBlock?.name];
                if (!javaState) {
                    chunk.setBlockStateId(posInChunk, 0);
                } else if (bedrockBlock.defaultState === bedrockStateId) {
                    chunk.setBlockStateId(posInChunk, javaState.defaultState);
                } else {
                    chunk.setBlockStateId(
                        posInChunk,
                        javaState.defaultState +
                        (bedrockStateId - bedrockBlock.defaultState)
                    );
                }
            }
        }
    }
    return chunk;
}
