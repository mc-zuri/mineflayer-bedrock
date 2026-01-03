import mineflayer, { createBot, type BedrockBot, type Bot } from "mineflayer";
import mineflayerPathfinder from "mineflayer-pathfinder";
import { BotStateMachine, StateMachineWebserver, WebserverBehaviorPositions } from "@nxg-org/mineflayer-static-statemachine";
import { buildFarmingMachine } from "./machines/farming.ts";
import { createFarmingContext } from "./context.ts";
import {
  IdleState, DepositState, HarvestState, PlantState, CutTreeState, PlantTreeState,
} from "./states/index.ts";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 19191;

export interface FarmingBotOptions {
  host?: string;
  port?: number;
  version: string;
}

export function createFarmingBot(options: FarmingBotOptions): BedrockBot {
  mineflayer.Logger.level = 0;

  const bot = createBot({
    host: options.host || DEFAULT_HOST,
    port: options.port || DEFAULT_PORT,
    auth: "offline",
    version: `bedrock_${options.version}`,
    // @ts-ignore
    offline: true,
    username: "bedrock-bot-1-21-130",
  }) as unknown as BedrockBot;

  bot.once("inject_allowed", () => {
    bot.loadPlugin(mineflayerPathfinder.pathfinder);
    // @ts-ignore
    bot.defaultMovements = new mineflayerPathfinder.Movements(bot);
    bot.defaultMovements.canDig = true;
    bot.defaultMovements.allow1by1towers = true;
    bot.defaultMovements.allowFreeMotion = true;
    bot.defaultMovements.allowParkour = true;
    bot.defaultMovements.allowSprinting = false;

    setTimeout(() => {
      bot.defaultMovements.scafoldingBlocks.push(bot.registry.itemsByName.dirt.id);
    }, 1000);

    bot.pathfinder.setMovements(bot.defaultMovements);
  });

  return bot;
}

export function startStateMachine(bot: BedrockBot): void {
  bot.farmingContext = createFarmingContext();

  const machine = new BotStateMachine({
    bot: bot as unknown as Bot,
    root: buildFarmingMachine(bot as unknown as Bot),
    autoStart: false,
  });

  // @ts-ignore - state machine event types
  machine.on("stateEntered", (_type: unknown, _cls: unknown, newState: { name?: string }) => {
    console.log(`State: ${newState?.name || "unknown"}`);
  });

  machine.start();

  const positions = new WebserverBehaviorPositions()
    .set(IdleState, 100, 200)
    .set(DepositState, 100, 350)
    .set(CutTreeState, 100, 50)
    .set(PlantTreeState, 300, 50)
    .set(HarvestState, 300, 200)
    .set(PlantState, 500, 200);

  const webserver = new StateMachineWebserver({
    stateMachine: machine,
    presetPositions: positions,
  });
  webserver.startServer();
  console.log("Webserver: http://localhost:8934");
}
