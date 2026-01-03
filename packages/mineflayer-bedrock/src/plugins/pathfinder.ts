import type { Bot, BotOptions } from 'mineflayer';
import { Vec3 } from 'vec3';
import * as pathfinder from 'mineflayer-pathfinder';

export function pathFinderPlugin(bot: Bot, options: BotOptions) {
  bot.once('spawn', () => {
    console.log('Bot spawned!');
    bot.loadPlugin(pathfinder.pathfinder);
    bot.pathfinder.setMovements(bot.defaultMovements);
  });
}
