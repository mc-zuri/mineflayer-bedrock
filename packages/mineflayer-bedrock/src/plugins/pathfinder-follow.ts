import type { Bot, BotOptions } from 'mineflayer';
import * as pathfinder from 'mineflayer-pathfinder';

export function pathFinderFollowPlugin(bot: Bot, options: BotOptions) {
  bot._client.on('text', async (params) => {
    if (params.type !== 'chat') return;

    let username = params.source_name;
    const target = bot.players[username].entity;
    if (params.message === 'follow') {
      bot.pathfinder.setGoal(new pathfinder.default.goals.GoalFollow(target, 3), true);
    } else if (params.message === 'avoid') {
      bot.pathfinder.setGoal(new pathfinder.default.goals.GoalInvert(new pathfinder.default.goals.GoalFollow(target, 5)), true);
    } else if (params.message === 'stop') {
      bot.pathfinder.setGoal(null);
    }
  });
}
