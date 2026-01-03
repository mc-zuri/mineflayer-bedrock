import type { Bot, BotOptions } from 'mineflayer';
import * as pathfinder from 'mineflayer-pathfinder';

export function viewerClickToMovePlugin(bot: Bot, options: BotOptions) {
  bot.viewer.on('blockClicked', (block, face, button) => {
    console.log('blockClicked', block, face, button);
    if (button !== 2) return; // only right click

    const p = block.position.offset(0, 1, 0);
    bot.pathfinder.setGoal(new pathfinder.default.goals.GoalBlock(p.x, p.y, p.z));
  });

  bot.viewer.on('gamepad', (state: any) => {
    console.log('gamepad', state);
    bot.setControlState('forward', state.controlsState.forward);
    bot.setControlState('back', state.controlsState.back);
    bot.setControlState('left', state.controlsState.left);
    bot.setControlState('right', state.controlsState.right);
    bot.setControlState('jump', state.controlsState.jump);
    bot.setControlState('sneak', state.controlsState.sneak);

    bot.cameraState = state.camera;
  });
}
