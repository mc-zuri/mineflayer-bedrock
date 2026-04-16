/**
 * Drop-in `createBot` wrapper that adds transparent SOCKS5 proxy support.
 *
 * Use exactly like `mineflayer.createBot`, but pass an additional `proxy`
 * option to route the bot through a SOCKS5 proxy with UDP ASSOCIATE. Returns
 * a Promise because setting up the UDP association is async.
 *
 *   const bot = await createBot({
 *     host: 'server.example',
 *     port: 19132,
 *     username: 'BedrockBot',
 *     version: 'bedrock_1.21.130',
 *     auth: 'offline',
 *     proxy: { host: '1.2.3.4', port: 1080, username: 'u', password: 'p' },
 *   });
 *
 * The relay is closed automatically when the bot emits `end`.
 */

import { createBot as mineflayerCreateBot, type Bot, type BotOptions } from 'mineflayer';
import { createSocksUdpRelay, type ProxyOptions, type UdpRelay } from './proxy.ts';

export type { ProxyOptions, UdpRelay } from './proxy.ts';

export interface ProxiedBotOptions extends BotOptions {
  /** SOCKS5 proxy. Must support UDP ASSOCIATE for Bedrock/RakNet traffic. */
  proxy?: ProxyOptions;
}

/** A Bot with an attached proxy relay (when `proxy` was provided). */
export type ProxiedBot = Bot & { proxyRelay?: UdpRelay };

export async function createBot(options: ProxiedBotOptions): Promise<ProxiedBot> {
  if (!options.proxy) {
    return mineflayerCreateBot(options) as ProxiedBot;
  }

  const { proxy, ...rest } = options;
  if (!rest.host) throw new Error('createBot: `host` is required when using a proxy');
  const destPort = rest.port ?? 19132;

  const relay = await createSocksUdpRelay(proxy, rest.host, destPort);

  const bot = mineflayerCreateBot({
    ...rest,
    host: relay.localHost,
    port: relay.localPort,
  }) as ProxiedBot;

  bot.proxyRelay = relay;
  bot.once('end', () => relay.close());

  return bot;
}
