import { Relay, type Version } from 'bedrock-protocol';
import { PackentDumpWriter } from './utils/packet-dump-writter.ts';

main();

function main(): void {
    const version: Version = '1.21.100' as any;
    const relay = new Relay({
        version,
        host: '0.0.0.0',
        port: 19150,
        enableChunkCaching: false,
        offline: false,
        destination: {
            host: '127.0.0.1',
            port: 19132
        }
        profilesFolder: 'C:/git/profiles',
        omitParseErrors: true
    });

    relay.on('connect', (player) => {
        const writter = new PackentDumpWriter('1.21.100');
        player.on('clientbound', (_:any, des:any) => {
            writter.writeClientbound(des.fullBuffer)
        })
        player.on('serverbound', (_:any, des:any) => {
            writter.writeServerbound(des.fullBuffer)
        })

        player.on('error', (err:any) => {
            console.error('Relay error:', err);
        });
    })

    relay.listen()
}
