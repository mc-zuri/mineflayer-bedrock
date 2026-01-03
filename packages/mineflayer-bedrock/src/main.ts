import { createBot } from 'mineflayer';
import { once, sleep } from 'mineflayer/lib/promise_utils.js';
import mineflayerPathfinder from 'mineflayer-pathfinder';
import { viewerClickToMovePlugin } from './plugins/viewer-click-to-move.ts';
import { pathFinderFollowPlugin } from './plugins/pathfinder-follow.ts';
import type { protocolTypes } from './protocol.js';
import { bedrockViewerPlugin } from './plugins/bedrock-viewer/index.ts';
import { createReplayClient } from 'minecraft-bedrock-server';
import { PlayerAuthInputAnalyzer } from 'minecraft-logs-analyzers';

const basePath = `logs/192.168.1.130-${new Date().valueOf()}`;

const bot = createBot({
  host: '127.0.0.1',
  port: 19132,
  auth: 'offline',
  username: 'BedrockBot',
  version: 'bedrock_1.21.130',
  profilesFolder: 'C:/git/profiles',
  offline: true,
  //packetLogger: new PlayerAuthInputAnalyzer(basePath),
  //client: createReplayClient(`/dumps/1.21.130-1766997036435 - activate hotbat slots.bin`) as any
});

bot._client.on('entity_event', async (data: protocolTypes.packet_entity_event) => {
  if (data.event_id == 'death_animation' && data.runtime_entity_id == bot.entity.id) {
    console.log('death_animation event received!');
    await sleep(200);

    bot._client.write('respawn', {
      position: { x: 0, y: 0, z: 0 },
      state: 2,
      runtime_entity_id: bot.entity.id,
    });

    console.log('waiting for respawn event...');
    await once(bot._client, 'respawn', (data) => data.state === 1);
    await sleep(200);
    console.log('respawn event received!');

    bot._client.write('player_action', {
      runtime_entity_id: bot.entity.id,
      action: 'respawn',
      position: { x: 0, y: 0, z: 0 },
      result_position: { x: 0, y: 0, z: 0 },
      face: -1,
    });
  }
});

bot.once('inject_allowed', () => {
  console.log('loading pathfinder');
  bot.loadPlugin(mineflayerPathfinder.pathfinder);
  bot.defaultMovements = new mineflayerPathfinder.Movements(bot);
  bot.defaultMovements.canDig = false;
  bot.defaultMovements.canOpenDoors = false;
  bot.defaultMovements.allowSprinting = true;
  bot.defaultMovements.allowParkour = true;
  bot.defaultMovements.allowFreeMotion = true;

  console.log('loading pathFinder - follow plugin');
  bot.loadPlugin(pathFinderFollowPlugin);

  bot.pathfinder.setMovements(bot.defaultMovements);
});

bot.on('error', (err) => console.error(err));
bot.on('end', () => {
  console.log('Bot disconnected.');
  bot.close();
});
bot.once('spawn', () => {
  console.log('Bot spawned!');

  console.log('loading viewer plugin');
  bot.loadPlugin(bedrockViewerPlugin);

  console.log('loading viewer - click to move plugin');
  bot.loadPlugin(viewerClickToMovePlugin);
});

bot._client.on('packet', (c) => {
  if (c.data.name === 'packet_violation_warning') {
    debugger;
  }
  console.log(c.data.name);
});

// Handle graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  try {
    bot.close();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  } catch {
    process.exit(0);
  }
});
