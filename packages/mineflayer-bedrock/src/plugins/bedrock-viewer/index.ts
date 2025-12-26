import type { Bot, BotOptions } from "mineflayer"
import express, { type Express } from 'express';
import path from 'path';
import compression from 'compression';
import { Vec3 } from 'vec3'
import { type Socket, Server } from 'socket.io'
import type { Block } from "prismarine-block";
import type { RaycastBlock } from "prismarine-world/types/iterators.js";
import { EventEmitter } from 'events';
import { createServer } from 'http'
import { WorldView } from "./world-wiew.ts";
import { BlockConverter } from "./block-converter.ts";

function setupRoutes(app: Express, prefix = '') {
    app.use(compression())
    app.use("/", express.static(path.resolve("node_modules", "prismarine-viewer", "public")));
}

type Primitive = { type: 'boxgrid', id: string, start: Vec3, end: Vec3, color: string | string } |
{ type: 'line', id: string, points: Vec3[], color: number | string }


export function bedrockViewerPlugin(bot: Bot, options: BotOptions) {
    (BigInt as any).prototype.toJSON = function () {
        return this.toString();
    };



    const viewDistance = options.bedrockViewer?.viewDistance ?? 6;
    const firstPerson = options.bedrockViewer?.firstPerson ?? false;
    const port = options.bedrockViewer?.port ?? 3000;
    const prefix = options.bedrockViewer?.prefix ?? '';
    const blockConverter = new BlockConverter("1.21.11", bot);

    const app = express()
    const http = createServer(app)

    const io = new Server(http, { path: prefix + '/socket.io' })

    setupRoutes(app, prefix)

    const sockets: Socket[] = []
    const primitives: Record<string, Primitive> = {}

    bot.viewer = new EventEmitter()

    bot.viewer.erase = (id) => {
        delete primitives[id]
        for (const socket of sockets) {
            socket.emit('primitive', { id })
        }
    }

    bot.viewer.drawBoxGrid = (id, start, end, color = 'aqua') => {
        primitives[id] = { type: 'boxgrid', id, start, end, color }
        for (const socket of sockets) {
            socket.emit('primitive', primitives[id])
        }
    }

    bot.viewer.drawLine = (id, points, color = 0xff0000) => {
        primitives[id] = { type: 'line', id, points, color }
        for (const socket of sockets) {
            socket.emit('primitive', primitives[id])
        }
    }

    bot.viewer.drawPoints = (id, points, color = 0xff0000, size = 5) => {
        primitives[id] = { type: 'points', id, points, color, size }
        for (const socket of sockets) {
            socket.emit('primitive', primitives[id])
        }
    }

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

    io.on('connection', (socket) => {
        socket.emit('version', blockConverter.javaVersion)
        sockets.push(socket)


        const worldView = new WorldView(bot.world, blockConverter, viewDistance, bot.entity.position, socket)
        worldView.init(bot.entity.position)

        worldView.on('blockClicked', (block: RaycastBlock & Block, face: number, button: number) => {
            bot.viewer.emit('blockClicked', block, face, button)
        })

        worldView.on('gamepad', (block, face, button) => {
            bot.viewer.emit('gamepad', block, face, button)
        })

        for (const id in primitives) {
            socket.emit('primitive', primitives[id])
        }

        let pos = new Vec3(0, 0, 0)
        function botPosition() {
            if (bot.entity.position.x == pos.x && bot.entity.position.y == pos.y && bot.entity.position.z == pos.z) {
                return;
            }
            const packet = { pos: bot.entity.position, yaw: bot.entity.yaw, addMesh: true, pitch: undefined as number | undefined }
            if (firstPerson) {
                packet.pitch = bot.entity.pitch
            }
            socket.emit('position', packet)
            worldView.updatePosition(bot.entity.position)
            pos.set(bot.entity.position.x, bot.entity.position.y, bot.entity.position.z);
        }

        bot.on('move', botPosition)
        worldView.listenToBot(bot)
        socket.on('disconnect', () => {
            bot.removeListener('move', botPosition)
            worldView.removeListenersFromBot(bot)
            sockets.splice(sockets.indexOf(socket), 1)
        })
    })

    http.listen(port, () => {
        console.log(`Prismarine viewer web server running on *:${port}`)
    })

    bot.viewer.close = () => {
        http.close()
        for (const socket of sockets) {
            socket.disconnect()
        }
    }
}





