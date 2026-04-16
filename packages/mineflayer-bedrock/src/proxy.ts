/**
 * Proxy support for Bedrock bots.
 *
 * Bedrock uses RakNet over UDP, and bedrock-protocol opens UDP sockets directly.
 * Standard TCP proxies do not work. Instead, we use SOCKS5 with UDP ASSOCIATE and
 * run a small local UDP relay: the bot connects to 127.0.0.1:<localPort> and the
 * relay wraps/unwraps every datagram in the SOCKS5 UDP request header, forwarding
 * it to the proxy's UDP bind endpoint. This keeps bedrock-protocol unchanged.
 *
 * SOCKS5 is the only supported scheme because SOCKS4 has no UDP support and HTTP
 * CONNECT is TCP-only.
 *
 * Usage:
 *   const relay = await createSocksUdpRelay({ host, port, username, password }, 'target.example', 19132);
 *   const bot = createBot({ host: relay.localHost, port: relay.localPort, ... });
 *   bot.on('end', () => relay.close());
 */

import dgram from 'node:dgram';
import net from 'node:net';
import { SocksClient, type SocksClientOptions } from 'socks';

export interface ProxyOptions {
  /** Proxy host (SOCKS5 server). */
  host: string;
  /** Proxy port (SOCKS5 server). */
  port: number;
  /** Optional username for SOCKS5 user/pass auth (RFC 1929). */
  username?: string;
  /** Optional password for SOCKS5 user/pass auth (RFC 1929). */
  password?: string;
}

export interface UdpRelay {
  /** Host the bot should connect to (always 127.0.0.1). */
  localHost: string;
  /** Port the bot should connect to. */
  localPort: number;
  /** Shut down the relay and close the SOCKS control connection. */
  close(): void;
}

/**
 * Build the SOCKS5 UDP request header prepended to every outgoing datagram.
 * Layout: RSV(2) | FRAG(1) | ATYP(1) | DST.ADDR | DST.PORT(2)
 */
function buildUdpRequestHeader(destHost: string, destPort: number): Buffer {
  const atypIsIp4 = net.isIPv4(destHost);
  const atypIsIp6 = net.isIPv6(destHost);

  let addrBuf: Buffer;
  let atyp: number;

  if (atypIsIp4) {
    atyp = 0x01;
    addrBuf = Buffer.from(destHost.split('.').map((o) => parseInt(o, 10)));
  } else if (atypIsIp6) {
    atyp = 0x04;
    // Expand :: and parse each hextet
    const parts = expandIPv6(destHost);
    addrBuf = Buffer.alloc(16);
    for (let i = 0; i < 8; i++) addrBuf.writeUInt16BE(parts[i], i * 2);
  } else {
    atyp = 0x03;
    const nameBuf = Buffer.from(destHost, 'ascii');
    addrBuf = Buffer.concat([Buffer.from([nameBuf.length]), nameBuf]);
  }

  const header = Buffer.alloc(4);
  header.writeUInt16BE(0, 0); // RSV
  header.writeUInt8(0, 2); // FRAG = 0 (no fragmentation)
  header.writeUInt8(atyp, 3);

  const portBuf = Buffer.alloc(2);
  portBuf.writeUInt16BE(destPort, 0);

  return Buffer.concat([header, addrBuf, portBuf]);
}

/** Parse the SOCKS5 UDP reply header and return the payload offset. */
function parseUdpReplyHeader(buf: Buffer): { payloadOffset: number } {
  if (buf.length < 10) throw new Error('SOCKS5 UDP reply too short');
  const frag = buf.readUInt8(2);
  if (frag !== 0) throw new Error('SOCKS5 UDP fragmentation not supported');
  const atyp = buf.readUInt8(3);
  let offset = 4;
  if (atyp === 0x01) offset += 4;
  else if (atyp === 0x04) offset += 16;
  else if (atyp === 0x03) {
    const len = buf.readUInt8(offset);
    offset += 1 + len;
  } else throw new Error(`Unknown ATYP in SOCKS5 UDP reply: ${atyp}`);
  offset += 2; // port
  return { payloadOffset: offset };
}

function expandIPv6(addr: string): number[] {
  // Split into 8 16-bit hextets, expanding ::
  const sides = addr.split('::');
  const head = sides[0] ? sides[0].split(':') : [];
  const tail = sides.length > 1 && sides[1] ? sides[1].split(':') : [];
  const fill = 8 - head.length - tail.length;
  const parts = [...head, ...Array(fill).fill('0'), ...tail];
  return parts.map((p) => parseInt(p || '0', 16));
}

/**
 * Establish a SOCKS5 UDP ASSOCIATE relay and bind a local UDP socket the bot
 * can connect to. All packets sent to the local socket are forwarded through
 * the proxy to destHost:destPort and vice versa.
 */
export async function createSocksUdpRelay(
  proxy: ProxyOptions,
  destHost: string,
  destPort: number,
): Promise<UdpRelay> {
  const socksOpts: SocksClientOptions = {
    proxy: {
      host: proxy.host,
      port: proxy.port,
      type: 5,
      userId: proxy.username,
      password: proxy.password,
    },
    command: 'associate',
    // 0.0.0.0:0 requests the proxy to accept from any source.
    destination: { host: '0.0.0.0', port: 0 },
  };

  const { socket: controlSocket, response } = await SocksClient.createConnection(socksOpts);
  const proxyUdpHost = response.host === '0.0.0.0' ? proxy.host : response.host;
  const proxyUdpPort = response.port;

  const udpFamily = net.isIPv6(proxyUdpHost) ? 'udp6' : 'udp4';
  const localSocket = dgram.createSocket(udpFamily);
  const proxySocket = dgram.createSocket(udpFamily);

  // Last known bot address on the local socket. Bedrock clients use a single
  // ephemeral source port for the life of the connection, so caching this is
  // sufficient.
  let botAddr: { address: string; port: number } | null = null;

  const udpHeader = buildUdpRequestHeader(destHost, destPort);

  localSocket.on('message', (msg, rinfo) => {
    botAddr = { address: rinfo.address, port: rinfo.port };
    const wrapped = Buffer.concat([udpHeader, msg]);
    proxySocket.send(wrapped, proxyUdpPort, proxyUdpHost);
  });

  proxySocket.on('message', (msg) => {
    if (!botAddr) return;
    try {
      const { payloadOffset } = parseUdpReplyHeader(msg);
      localSocket.send(msg.subarray(payloadOffset), botAddr.port, botAddr.address);
    } catch {
      // Ignore malformed replies rather than crashing the bot.
    }
  });

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      localSocket.once('error', reject);
      localSocket.bind(0, '127.0.0.1', () => {
        localSocket.off('error', reject);
        resolve();
      });
    }),
    new Promise<void>((resolve, reject) => {
      proxySocket.once('error', reject);
      proxySocket.bind(0, () => {
        proxySocket.off('error', reject);
        resolve();
      });
    }),
  ]);

  const address = localSocket.address();

  // SOCKS5 UDP ASSOCIATE requires the TCP control connection to remain open
  // for the lifetime of the association. Closing it tears down the relay.
  controlSocket.on('close', () => {
    try { localSocket.close(); } catch {}
    try { proxySocket.close(); } catch {}
  });

  return {
    localHost: address.address,
    localPort: address.port,
    close() {
      try { controlSocket.destroy(); } catch {}
      try { localSocket.close(); } catch {}
      try { proxySocket.close(); } catch {}
    },
  };
}
