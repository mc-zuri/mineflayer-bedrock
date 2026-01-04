import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Title-related packets
const PACKETS_TO_LOG = [
  'set_title', // Title/subtitle/actionbar display
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all title-related packet names */
export type TitlePacketName = (typeof PACKETS_TO_LOG)[number];

/**
 * Analyzer for title-related packets.
 *
 * Packets captured:
 * | Direction     | Packet    | Purpose                      | Key Fields                              |
 * |---------------|-----------|------------------------------|-----------------------------------------|
 * | Server→Client | set_title | Display title/subtitle/etc   | type, text, fade_in_time, stay_time, fade_out_time |
 *
 * Title types:
 *   - clear: Clear current title
 *   - reset: Reset title settings to default
 *   - set_title: Show main title text
 *   - set_subtitle: Show subtitle text
 *   - set_actionbar: Show actionbar text
 *   - set_times: Set fade/stay timing
 *   - title_text_object: JSON title text
 *   - subtitle_text_object: JSON subtitle text
 *   - actionbar_text_object: JSON actionbar text
 *
 * Title flow:
 *   S→C: set_title {type: "set_times", fade_in: 10, stay: 70, fade_out: 20}
 *   S→C: set_title {type: "set_title", text: "Hello"}
 *   S→C: set_title {type: "set_subtitle", text: "World"}
 *   S→C: set_title {type: "set_actionbar", text: "Action!"}
 *   S→C: set_title {type: "clear"}
 *   S→C: set_title {type: "reset"}
 */
export class TitleAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<TitlePacketName> = {
    name: 'title',
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
    return this.config.packets.includes(name as TitlePacketName);
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as TitlePacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in TitlePacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    set_title: (base, packet) => {
      const p = packet as PacketParams<'set_title'>;

      // Parse JSON text if present
      let text = p.text;
      if (text && text.startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.rawtext?.[0]?.text) {
            text = parsed.rawtext[0].text;
          } else if (parsed.rawtext?.[0]?.translate) {
            text = parsed.rawtext[0].translate;
          }
        } catch {
          // Keep original text
        }
      }

      return {
        ...base,
        titleType: p.type,
        text: text?.trim(),
        fadeIn: p.fade_in_time,
        stay: p.stay_time,
        fadeOut: p.fade_out_time,
        xuid: p.xuid,
        platformOnlineId: p.platform_online_id,
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
