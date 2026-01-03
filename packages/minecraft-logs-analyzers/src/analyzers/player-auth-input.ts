import { BaseAnalyzer } from '../base-analyzer.ts';
import type { AnalyzerConfig, Direction, LogEntry } from '../types.ts';

const PACKETS_TO_LOG = ['player_auth_input'] as const;

type Vec3f = { x: number; y: number; z: number };
type InputData = Record<string, boolean>;

export class PlayerAuthInputAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<(typeof PACKETS_TO_LOG)[number]> = {
    name: 'player-auth-input',
    packets: PACKETS_TO_LOG,
  };

  private lastPosition: Vec3f | null = null;
  private lastDelta: Vec3f | null = null;
  private lastInputData: InputData = {};

  constructor(basePath: string) {
    super(basePath);
    this.init();
  }

  protected extractFields(direction: Direction, name: string, packet: any): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    this.updateTick(packet);

    const entry: LogEntry = { ...base };
    let hasChanges = false;

    // Position change
    if (this.hasVec3Changed(this.lastPosition, packet.position)) {
      entry.pos = packet.position;
      this.lastPosition = { ...packet.position };
      hasChanges = true;
    }

    // Velocity (delta) change
    if (this.hasVec3Changed(this.lastDelta, packet.delta)) {
      entry.vel = packet.delta;
      this.lastDelta = { ...packet.delta };
      hasChanges = true;
    }

    // Input flags changes
    const { changed, cleared } = this.getInputChanges(packet.input_data);
    if (changed.length > 0 || cleared.length > 0) {
      if (changed.length > 0) entry.inputChanged = changed;
      if (cleared.length > 0) entry.inputCleared = cleared;
      this.lastInputData = { ...packet.input_data };
      hasChanges = true;
    }

    return hasChanges ? entry : null;
  }

  private hasVec3Changed(last: Vec3f | null, current: Vec3f): boolean {
    if (!last) return true;
    return last.x !== current.x || last.y !== current.y || last.z !== current.z;
  }

  private getInputChanges(current: InputData): { changed: string[]; cleared: string[] } {
    const changed: string[] = [];
    const cleared: string[] = [];
    for (const [key, value] of Object.entries(current)) {
      const wasSet = this.lastInputData[key] ?? false;
      if (value && !wasSet) changed.push(key);
      if (!value && wasSet) cleared.push(key);
    }
    return { changed, cleared };
  }
}
