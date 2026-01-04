import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Scoreboard-related packets
const PACKETS_TO_LOG = [
  'set_display_objective', // Set which objective to display
  'set_score', // Update/remove scores
  'remove_objective', // Remove objective entirely
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all scoreboard-related packet names */
export type ScoreboardPacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for scoreboard-related packets.
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose                  | Key Fields                           |
 * |---------------|-----------------------|--------------------------|--------------------------------------|
 * | Server→Client | set_display_objective | Display objective        | display_slot, objective_name, criteria |
 * | Server→Client | set_score             | Update/remove scores     | action, entries (entity_id, score)   |
 * | Server→Client | remove_objective      | Remove objective         | objective_name                       |
 *
 * Scoreboard flow:
 *   S→C: set_display_objective {display_slot: "sidebar", objective_name: "test", criteria: "dummy"}
 *   S→C: set_score {action: "change", entries: [{entity_unique_id, objective_name, score}]}
 *   S→C: set_score {action: "remove", entries: [{entity_unique_id, objective_name}]}
 *   S→C: remove_objective {objective_name: "test"}
 */
export class ScoreboardAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<ScoreboardPacketName> = {
    name: 'scoreboard',
    packets: PACKETS_TO_LOG,
  };

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, _packet: unknown): boolean {
    return this.config.packets.includes(name as ScoreboardPacketName);
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as ScoreboardPacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in ScoreboardPacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    set_display_objective: (base, packet) => {
      const p = packet as PacketParams<'set_display_objective'>;
      return {
        ...base,
        displaySlot: p.display_slot,
        objectiveName: p.objective_name,
        displayName: p.display_name,
        criteria: p.criteria_name,
        sortOrder: p.sort_order,
      };
    },

    set_score: (base, packet) => {
      const p = packet as PacketParams<'set_score'>;
      const entries = (p.entries || []).map((entry: any) => ({
        entityId: entry.scoreboard_id ?? entry.entity_unique_id,
        objectiveName: entry.objective_name,
        score: entry.score,
        type: entry.identity_type,
        name: entry.custom_name ?? entry.fake_player_name,
      }));

      return {
        ...base,
        action: p.action,
        entries,
      };
    },

    remove_objective: (base, packet) => {
      const p = packet as PacketParams<'remove_objective'>;
      return {
        ...base,
        objectiveName: p.objective_name,
      };
    },

    text: (base, packet) => {
      const p = packet as PacketParams<'text'>;

      let message = p.message;
      if (message && message.startsWith('{')) {
        try {
          const parsed = JSON.parse(message);
          if (parsed.rawtext?.[0]?.text) {
            message = parsed.rawtext[0].text;
          } else if (parsed.rawtext?.[0]?.translate) {
            message = parsed.rawtext[0].translate;
          }
        } catch {
          // Keep original message
        }
      }

      return {
        ...base,
        type: p.type,
        message: message?.trim(),
        source: p.source_name,
      };
    },
  };
}
