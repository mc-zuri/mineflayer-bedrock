import { Movements } from 'mineflayer-pathfinder'
import { EventEmitter } from 'events'
import { Vec3 } from 'vec3';
import { RaycastBlock } from 'prismarine-world/types/iterators.js';
import { Block } from "prismarine-block";
import { protocolTypes } from './protocol.js';
import * as pathfinder from 'mineflayer-pathfinder'

interface Viewer extends EventEmitter<{ 'blockClicked': [RaycastBlock & Block, number, number], gamepad: [any] }> {
    erase(id: string): void;
    drawBoxGrid(id: string, start: Vec3, end: Vec3, color?: string): void
    drawLine(id: string, points: Vec3[], color?: string | number): void;
    drawPoints(id: string, points: Vec3[], color?: string | number, size?: number): void;
    close(): void;
}

declare module 'mineflayer' {
    interface Bot {
        defaultMovements: Movements;
        viewer: Viewer;

        on(event: 'inject_allowed', listener: () => void): this;
        on(event: 'error', listener: (error: Error) => void): this;
        on(event: 'end', listener: () => void): this;

        on(event: 'path_update', listener: (path: pathfinder.PartiallyComputedPath) => void): this;
        on(event: 'path_reset', listener: (reason: 'goal_updated' | 'movements_updated' |
            'block_updated' | 'chunk_loaded' | 'goal_moved' | 'dig_error' |
            'no_scaffolding_blocks' | 'place_error' | 'stuck') => void): this;
        on(event: 'goal_reached', listener: (goal: pathfinder.goals.Goal) => void): this;
        on(event: 'goal_updated', listener: (goal: pathfinder.goals.Goal, dynamic: boolean) => void): this;
        on(event: 'physicsTick', listener: () => void): this;
    }
    interface BotOptions {
        offline?: boolean
        bedrockViewer?:{
            viewDistance?: number
            firstPerson?: boolean
            port?: number
            prefix?: string
        }
    }
}

declare module 'minecraft-protocol' {
    interface Client {
        on(event: 'start_game', listener: (params: protocolTypes.packet_start_game) => void): this;
        on(event: 'text', listener: (params: protocolTypes.packet_text) => void): this;
        on(event: 'spawn', listener: (params: protocolTypes.packet_respawn) => void): this;
    }
}