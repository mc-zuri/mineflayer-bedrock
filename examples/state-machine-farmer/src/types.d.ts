import { Movements } from 'mineflayer-pathfinder';

declare module 'mineflayer' {
  interface BedrockBot {
    defaultMovements: Movements;
  }
}
