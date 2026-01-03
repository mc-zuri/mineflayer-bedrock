import { startBDSServer, ensureBDSInstalled } from "mineflayer-bds-tests";
import { VERSION, BDS_PATH } from "./config.ts";
import { setupFarm } from "./setup.ts";
import { createFarmingBot, startStateMachine } from "./bot-setup.ts";

const args = process.argv.slice(2);
const host = args[0] || "127.0.0.1";
const port = parseInt(args[1]) || 19191;

async function main(): Promise<void> {
  console.log("Starting State Machine Farmer...");

  await ensureBDSInstalled(VERSION, BDS_PATH);
  const server = await startBDSServer({ port });
  const bot = createFarmingBot({ host, port, version: VERSION });

  bot.on("error", err => console.error("Bot error:", err));
  bot.on("end", () => console.log("Bot disconnected"));

  bot.once("spawn", async () => {
    console.log("Bot spawned!");
    await bot.waitForChunksToLoad();
    await setupFarm(server, bot.username);
    startStateMachine(bot);
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    bot.close();
    await server.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
