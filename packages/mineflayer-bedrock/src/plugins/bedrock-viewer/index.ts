import type { Bot, BotOptions } from 'mineflayer';
import { Vec3 } from 'vec3';
import prismarineViewer from 'prismarine-viewer';

// prismarine-viewer draws Bedrock worlds with the version's own Bedrock assets: it reads the bot's world, entities and
// the packets trackBedrock keeps, so the blocks no longer have to be converted to Java ones.
export function bedrockViewerPlugin(bot: Bot, options: BotOptions) {
  // workaround for bigint serialization in socket.io
  (BigInt as any).prototype.toJSON = function () {
    return this.toString();
  };

  prismarineViewer.mineflayer(bot, {
    viewDistance: options.bedrockViewer?.viewDistance ?? 6,
    firstPerson: options.bedrockViewer?.firstPerson ?? false,
    port: options.bedrockViewer?.port ?? 3000,
    prefix: options.bedrockViewer?.prefix ?? '',
  });

  bot.on('path_update', (r) => {
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
