import { spiral, ViewRect, chunkPos } from './simpleUtils.ts';
import { Vec3 } from 'vec3';
import { type World } from 'prismarine-world';
import { type Block } from 'prismarine-block';
import { EventEmitter } from 'events';
import type { RaycastBlock } from 'prismarine-world/types/iterators.js';
import type { Bot } from 'mineflayer';
import { type Entity } from 'prismarine-entity';
import type { BlockConverter } from './block-converter.ts';

type Events = {
  mouseClick: [
    {
      origin: { x: number; y: number; z: number };
      direction: { x: number; y: number; z: number };
      button: number;
    },
  ];
  blockClicked: [RaycastBlock, number, number];
  gamepad: [any];
};

export class WorldView extends EventEmitter<Events> {
  world: World;
  viewDistance: number;
  loadedChunks: Record<string, boolean>;
  lastPos: Vec3;
  emitter: EventEmitter<any>;
  listeners: any;
  blockConverter: BlockConverter;

  constructor(world: World, blockConverter: BlockConverter, viewDistance: number, position = new Vec3(0, 0, 0), emitter: EventEmitter<{}> | null = null) {
    super();
    this.world = world;
    this.viewDistance = viewDistance;
    this.blockConverter = blockConverter;
    this.loadedChunks = {};
    this.lastPos = new Vec3(0, 0, 0).update(position);
    this.emitter = emitter ?? (this as any);

    this.listeners = {};
    this.emitter.on('mouseClick', async (click) => {
      const ori = new Vec3(click.origin.x, click.origin.y, click.origin.z);
      const dir = new Vec3(click.direction.x, click.direction.y, click.direction.z);
      const bedrockBlock = await this.world.raycast(ori, dir, 256);
      if (!bedrockBlock) return;
      const javaBlock = this.blockConverter.getJavaBlockByBedrockId(bedrockBlock.stateId);
      javaBlock.position = bedrockBlock.position;
      this.emit('blockClicked', javaBlock as any, bedrockBlock.face, click.button);
    });

    this.emitter.on('gamepad', async (state) => {
      this.emit('gamepad', state);
    });
  }

  listenToBot(bot: Bot) {
    const worldView = this;
    this.listeners[bot.username] = {
      // 'move': botPosition,
      entitySpawn: function (e: Entity) {
        if (e === bot.entity) return;
        worldView.emitter.emit('entity', {
          id: e.id,
          name: e.name,
          pos: e.position,
          width: e.width,
          height: e.height,
          username: e.username,
        });
      },
      entityMoved: function (e: Entity) {
        worldView.emitter.emit('entity', { id: e.id, pos: e.position, pitch: e.pitch, yaw: e.yaw });
      },
      entityGone: function (e: Entity) {
        worldView.emitter.emit('entity', { id: e.id, delete: true });
      },
      chunkColumnLoad: function (pos: Vec3) {
        worldView.loadChunk(pos);
      },
      blockUpdate: (oldBlock: Block, newBlock: Block) => {
        const stateId = newBlock.stateId ? newBlock.stateId : (newBlock.type << 4) | newBlock.metadata;
        const javaState = this.blockConverter.getJavaStateId(stateId);
        worldView.emitter.emit('blockUpdate', { pos: oldBlock.position, javaState });
      },
    };

    for (const [evt, listener] of Object.entries(this.listeners[bot.username])) {
      bot.on(evt as any, listener as any);
    }

    for (const id in bot.entities) {
      const e = bot.entities[id];
      if (e && e !== bot.entity) {
        this.emitter.emit('entity', {
          id: e.id,
          name: e.name,
          pos: e.position,
          width: e.width,
          height: e.height,
          username: e.username,
        });
      }
    }
  }

  removeListenersFromBot(bot: Bot) {
    for (const [evt, listener] of Object.entries(this.listeners[bot.username])) {
      bot.removeListener(evt as any, listener);
    }
    delete this.listeners[bot.username];
  }

  async init(pos: Vec3) {
    const [botX, botZ] = chunkPos(pos);

    const positions: Vec3[] = [];
    spiral(this.viewDistance * 2, this.viewDistance * 2, (x, z) => {
      const p = new Vec3((botX + x) * 16, 0, (botZ + z) * 16);
      positions.push(p);
    });

    this.lastPos.update(pos);
    await this._loadChunks(positions);
  }

  async _loadChunks(positions: Vec3[], sliceSize = 5, waitTime = 0) {
    for (let i = 0; i < positions.length; i += sliceSize) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      await Promise.all(positions.slice(i, i + sliceSize).map((p) => this.loadChunk(p)));
    }
  }

  async loadChunk(pos: Vec3) {
    const [botX, botZ] = chunkPos(this.lastPos);
    const dx = Math.abs(botX - Math.floor(pos.x / 16));
    const dz = Math.abs(botZ - Math.floor(pos.z / 16));
    if (dx < this.viewDistance && dz < this.viewDistance) {
      const column = await this.world.getColumnAt(pos);
      if (column) {
        const javaColumn = this.blockConverter.convertColumn(column);
        const javaChunk = javaColumn.toJson();
        this.emitter.emit('loadChunk', { x: pos.x, z: pos.z, chunk: javaChunk });
        this.loadedChunks[`${pos.x},${pos.z}`] = true;
      }
    }
  }

  unloadChunk(pos: Vec3) {
    this.emitter.emit('unloadChunk', { x: pos.x, z: pos.z });
    delete this.loadedChunks[`${pos.x},${pos.z}`];
  }

  async updatePosition(pos: Vec3, force = false) {
    const [lastX, lastZ] = chunkPos(this.lastPos);
    const [botX, botZ] = chunkPos(pos);
    if (lastX !== botX || lastZ !== botZ || force) {
      const newView = new ViewRect(botX, botZ, this.viewDistance);
      for (const coords of Object.keys(this.loadedChunks)) {
        const x = parseInt(coords.split(',')[0]);
        const z = parseInt(coords.split(',')[1]);
        const p = new Vec3(x, 0, z);
        if (!newView.contains(Math.floor(x / 16), Math.floor(z / 16))) {
          this.unloadChunk(p);
        }
      }
      const positions: Vec3[] = [];
      spiral(this.viewDistance * 2, this.viewDistance * 2, (x, z) => {
        const p = new Vec3((botX + x) * 16, 0, (botZ + z) * 16);
        if (!this.loadedChunks[`${p.x},${p.z}`]) {
          positions.push(p);
        }
      });
      this.lastPos.update(pos);
      await this._loadChunks(positions);
    } else {
      this.lastPos.update(pos);
    }
  }
}
