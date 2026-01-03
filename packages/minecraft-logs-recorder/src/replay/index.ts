'use strict';

import { EventEmitter } from 'events';
import { PacketDumpReader } from 'minecraft-bedrock-server';

export class BedrockReplayClient extends EventEmitter {
  #reader;
  count = 0;

  constructor(filename: string, skipDelay = false) {
    super();
    this.#reader = new PacketDumpReader(filename);
    setTimeout(() => this.simulate(skipDelay), 500);
  }

  async simulate(skipDelay = false) {
    let ret;
    let simulationStartTime = process.hrtime.bigint();
    let firstEventTime: bigint | null = null;

    while ((ret = this.#reader.read())) {
      // Capture the first event's timestamp as reference
      if (firstEventTime === null) {
        firstEventTime = ret.time;
      }

      const timeSinceRecordingStart = ret.time - firstEventTime;
      const timeSinceSimulationStart = process.hrtime.bigint() - simulationStartTime;
      const delayNeeded = timeSinceRecordingStart - timeSinceSimulationStart;

      // Wait if we're ahead of schedule
      if (delayNeeded > 0n && !skipDelay) {
        const delayMs = Number(delayNeeded / 1_000_000n);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        await new Promise((resolve) => setImmediate(resolve));
      }

      this.count++;
      this.emit(ret.data.name, ret.data.params);
    }
  }

  queue() {}

  write(name: string, params: any) {
    // console.log(`Writing packet: ${name}`, serialize(params, 2));
  }
}

export function createReplayClient(filename: string, skipDelay = false) {
  return new BedrockReplayClient(filename, skipDelay);
}
