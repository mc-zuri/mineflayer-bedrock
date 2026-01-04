import { BaseAnalyzer } from '../base-analyzer.ts';
import type { Direction, LogEntry, AnalyzerConfig, PacketParams, PacketParamsMap } from '../types.ts';

// Item consumption and use related packets
const PACKETS_TO_LOG = [
  'inventory_transaction', // Item use (eat, drink, use on entity)
  'player_action', // Start/stop eating, item use actions
  'actor_event', // Entity eating effects
  'mob_effect', // Effects applied from food/potions
  'update_attributes', // Health/hunger/saturation changes
  'set_entity_data', // Entity state changes (eating animation)
  'level_sound_event', // Eating/drinking sounds
  'animate', // Eating animation
  'inventory_slot', // Slot updates after consuming
  'text', // Scenario markers
] as const satisfies readonly (keyof PacketParamsMap)[];

/** Union type of all consume-related packet names */
export type ConsumePacketName = (typeof PACKETS_TO_LOG)[number];

/** Consume-related player actions */
const CONSUME_ACTIONS = [
  'start_item_use_on', // Start using item on block/entity
  'stop_item_use_on', // Stop using item
  'release_item', // Release charged item (bow, crossbow)
  'start_eating', // Start eating (not always used)
  'stop_eating', // Stop eating
] as const;

/**
 * Analyzer for item consumption packets (eating, drinking, feeding).
 *
 * Packets captured:
 * | Direction     | Packet                | Purpose                  | Key Fields                           |
 * |---------------|-----------------------|--------------------------|--------------------------------------|
 * | Client→Server | inventory_transaction | Use item (eat/drink)     | item_use, click_air, held_item       |
 * | Client→Server | player_action         | Start/stop eating        | start_item_use_on, release_item      |
 * | Server→Client | mob_effect            | Effect applied           | effect_id, duration, amplifier       |
 * | Server→Client | update_attributes     | Hunger/health change     | health, hunger, saturation           |
 * | Server→Client | level_sound_event     | Eating/drinking sounds   | eat, drink, burp                     |
 * | Server→Client | inventory_slot        | Item consumed            | slot, item (count decreased)         |
 *
 * Eating food flow:
 *   C→S: player_action {action: "start_item_use_on"}
 *   C→S: inventory_transaction {type: "item_use", action: "click_air", item: food}
 *   S→C: level_sound_event {sound: "eat"} (multiple times)
 *   C→S: player_action {action: "release_item"} (when eating complete)
 *   S→C: update_attributes {hunger, saturation}
 *   S→C: inventory_slot {slot, item with count-1}
 *
 * Drinking potion flow:
 *   C→S: inventory_transaction {type: "item_use", action: "click_air", item: potion}
 *   S→C: level_sound_event {sound: "drink"}
 *   S→C: mob_effect {effect_id, duration, amplifier}
 *   S→C: inventory_slot {slot, item: glass_bottle or empty}
 *
 * Feeding animal flow:
 *   C→S: inventory_transaction {type: "item_use_on_entity", entity_runtime_id, item: wheat}
 *   S→C: actor_event {event: "love_particles"}
 *   S→C: inventory_slot {slot, item count-1}
 */
export class ConsumeAnalyzer extends BaseAnalyzer {
  readonly config: AnalyzerConfig<ConsumePacketName> = {
    name: 'consume',
    packets: PACKETS_TO_LOG,
  };

  constructor(basePath: string, registry?: any) {
    super(basePath);
    if (registry) {
      this.registry = registry;
    }
    this.init();
  }

  protected shouldLog(name: string, packet: unknown): boolean {
    if (!this.config.packets.includes(name as ConsumePacketName)) return false;

    // Filter player_action to consume-related actions
    if (name === 'player_action') {
      const p = packet as PacketParams<'player_action'>;
      return CONSUME_ACTIONS.includes(p.action as (typeof CONSUME_ACTIONS)[number]);
    }

    // Filter inventory_transaction to item_use and item_use_on_entity
    if (name === 'inventory_transaction') {
      const p = packet as PacketParams<'inventory_transaction'>;
      const txType = p.transaction?.transaction_type;
      return txType === 'item_use' || txType === 'item_use_on_entity';
    }

    // Filter level_sound_event to eating/drinking sounds
    if (name === 'level_sound_event') {
      const p = packet as PacketParams<'level_sound_event'>;
      const soundName = String(p.sound_id || '').toLowerCase();
      return (
        soundName.includes('eat') ||
        soundName.includes('drink') ||
        soundName.includes('burp') ||
        soundName.includes('gulp') ||
        soundName.includes('generic_eat')
      );
    }

    // Filter animate to eating animation
    if (name === 'animate') {
      const p = packet as PacketParams<'animate'>;
      const action = String(p.action_id || '');
      return action.includes('eat') || action.includes('swing');
    }

    // Log all mob_effect (potion effects)
    if (name === 'mob_effect') {
      return true;
    }

    // Log all update_attributes (hunger/health changes)
    if (name === 'update_attributes') {
      return true;
    }

    return true;
  }

  protected extractFields(direction: Direction, name: string, packet: unknown): LogEntry | null {
    const base = this.createBaseEntry(direction, name);
    const handler = this.handlers[name as ConsumePacketName];

    if (handler) {
      return handler(base, packet);
    }
    return null;
  }

  // ============================================================================
  // Typed Packet Handlers
  // ============================================================================

  private handlers: {
    [K in ConsumePacketName]: (base: LogEntry, packet: unknown) => LogEntry | null;
  } = {
    player_action: (base, packet) => {
      const p = packet as PacketParams<'player_action'>;
      return {
        ...base,
        action: p.action,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        face: p.face,
      };
    },

    inventory_transaction: (base, packet) => {
      const p = packet as PacketParams<'inventory_transaction'>;
      const tx = p.transaction as any;

      type TransactionData = {
        action_type?: string;
        hotbar_slot?: number;
        held_item?: { network_id?: number; count?: number };
        position?: { x: number; y: number; z: number };
        entity_runtime_id?: string | number;
      };
      const txData = tx?.transaction_data as TransactionData | undefined;

      return {
        ...base,
        type: tx?.transaction_type,
        action: txData?.action_type,
        slot: txData?.hotbar_slot,
        item: txData?.held_item ? this.itemName(txData.held_item) : undefined,
        itemCount: txData?.held_item?.count,
        entityId: txData?.entity_runtime_id,
        pos: txData?.position ? [txData.position.x, txData.position.y, txData.position.z] : undefined,
      };
    },

    mob_effect: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        entityId: p.runtime_entity_id,
        eventId: p.event_id,
        effectId: p.effect_id,
        amplifier: p.amplifier,
        particles: p.particles,
        duration: p.duration,
        tick: p.tick,
      };
    },

    update_attributes: (base, packet) => {
      const p = packet as any;
      const attributes = (p.attributes || []).map((attr: any) => ({
        name: attr.name,
        current: attr.current,
        min: attr.min,
        max: attr.max,
        default: attr.default,
      }));

      // Filter to relevant attributes
      const relevantAttrs = attributes.filter((a: any) =>
        a.name?.includes('hunger') ||
        a.name?.includes('saturation') ||
        a.name?.includes('health') ||
        a.name?.includes('food')
      );

      if (relevantAttrs.length === 0) return null;

      return {
        ...base,
        entityId: p.runtime_entity_id,
        attributes: relevantAttrs,
      };
    },

    set_entity_data: (base, packet) => {
      const p = packet as PacketParams<'set_entity_data'>;
      type MetadataEntry = { key: string; type: string; value: unknown };
      const metadata = p.metadata as MetadataEntry[] | undefined;

      // Filter to eating-related metadata
      const eatingMetadata = metadata?.filter((m) =>
        m.key?.includes('eat') || m.key?.includes('using_item')
      );

      if (!eatingMetadata || eatingMetadata.length === 0) return null;

      return {
        ...base,
        entityId: p.runtime_entity_id,
        metadata: eatingMetadata,
      };
    },

    level_sound_event: (base, packet) => {
      const p = packet as PacketParams<'level_sound_event'>;
      return {
        ...base,
        sound: p.sound_id,
        pos: p.position ? [p.position.x, p.position.y, p.position.z] : undefined,
        extraData: p.extra_data,
        entityType: p.entity_type,
      };
    },

    animate: (base, packet) => {
      const p = packet as PacketParams<'animate'>;
      return {
        ...base,
        action: p.action_id,
        entityId: p.runtime_entity_id,
      };
    },

    actor_event: (base, packet) => {
      const p = packet as any;
      return {
        ...base,
        entityId: p.runtime_id,
        eventId: p.event_id,
        data: p.data,
      };
    },

    inventory_slot: (base, packet) => {
      const p = packet as PacketParams<'inventory_slot'>;
      return {
        ...base,
        windowId: p.window_id,
        slot: p.slot,
        item: this.itemName(p.item),
        count: (p.item as any)?.count,
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
