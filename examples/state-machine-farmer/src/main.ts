import { startExternalServer, ensureBDSInstalled } from 'minecraft-bedrock-test-server';
import { VERSION, BDS_PATH } from './config.ts';
import { setupFarm } from './setup.ts';
import { createFarmingBot, startStateMachine } from './bot-setup.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const host = args[0] || '127.0.0.1';
const port = parseInt(args[1]) || 19191;

async function main(): Promise<void> {
  console.log('Starting State Machine Farmer...');

  await ensureBDSInstalled(VERSION, BDS_PATH);
  const server = await startExternalServer({ port, bdsPath: BDS_PATH });

  // Print connection details and wait for user to connect
  console.log('\n========================================');
  console.log('  CONNECTION DETAILS');
  console.log('========================================');
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  BDS:  ${BDS_PATH}`);
  console.log('========================================');
  console.log('  Waiting 10 seconds before bot connects...');
  console.log('========================================\n');
  await sleep(10000);

  const bot = createFarmingBot({ host, port, version: VERSION });

  bot.on('error', (err) => console.error('Bot error:', err));
  bot.on('end', () => console.log('Bot disconnected'));

  bot.once('spawn', async () => {
    console.log('Bot spawned!');
    await bot.waitForChunksToLoad();
    await setupFarm(server, bot.username);
    startStateMachine(bot);
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    bot.close();
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
