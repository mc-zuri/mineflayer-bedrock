import { Movements } from 'mineflayer-pathfinder';
import { EventEmitter } from 'events';
import { Vec3 } from 'vec3';
import { RaycastBlock } from 'prismarine-world/types/iterators.js';
import { Block } from 'prismarine-block';

// Shared protocol types inherited from root tsconfig.base.json → types/bedrock-protocol.d.ts

declare module 'mineflayer' {
  interface Bot {
    defaultMovements: Movements;
  }
}

interface Viewer extends EventEmitter<{
  blockClicked: [RaycastBlock & Block, number, number];
  gamepad: [any];
}> {
  erase(id: string): void;
  drawBoxGrid(id: string, start: Vec3, end: Vec3, color?: string): void;
  drawLine(id: string, points: Vec3[], color?: string | number): void;
  drawPoints(id: string, points: Vec3[], color?: string | number, size?: number): void;
  close(): void;
}
