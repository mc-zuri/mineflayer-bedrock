declare namespace protocolTypes {
	export type ByteArray = Buffer;
	export type SignedByteArray = Buffer;
	export type LittleString = string;
	export type LatinString = string;
	export type ShortArray = Buffer;
	export type ShortString = string;
	/**
	 * UUID is the UUID of the command called. This UUID is a bit odd as it is not specified by the server. It
	 * is not clear what exactly this UUID is meant to identify, but it is unique for each command called.
	 */
	export type uuid = string;
	export type byterot = number;
	export type restBuffer = Buffer;
	export type encapsulated = any;
	export type nbt = any;
	export type lnbt = any;
	export type nbtLoop = any;
	export type enum_size_based_on_values_len = "byte" | "short" | "int";
	export type MapInfo = any;
	export type TexturePackInfos = {
		uuid: string;
		version: string;
		size: bigint;
		content_key: string;
		sub_pack_name: string;
		content_identity: string;
		has_scripts: boolean;
		addon_pack: boolean;
		rtx_enabled: boolean;
		/** cdn_url is a URL that the client can use to download the pack instead of the server sending it in chunks, which it will continue to do if this field is left empty. */
		cdn_url: string;
	}[];
	export type ResourcePackIdVersions = {
		/** The ID of the resource pack. */
		uuid: string;
		/** The version of the resource pack. */
		version: string;
		/** The subpack name of the resource pack. */
		name: string;
	}[];
	export type ResourcePackIds = string[];
	export type Experiment = {
		name: string;
		enabled: boolean;
	};
	export type Experiments = Experiment[];
	export type GameMode = "survival" | "creative" | "adventure" | "survival_spectator" | "creative_spectator" | "fallback" | "spectator";
	export type GameRuleI32 = {
		name: string;
		editable: boolean;
		type: "bool" | "int" | "float";
		value: boolean | number;
	};
	export type GameRuleVarint = {
		name: string;
		editable: boolean;
		type: "bool" | "int" | "float";
		value: boolean | number;
	};
	/**
	 * CacheBlob represents a blob as used in the client side blob cache protocol. It holds a hash of its data and
	 * the full data of it.
	 */
	export type Blob = {
		/** Hash is the hash of the blob. The hash is computed using xxHash, and must be deterministic for the same chunk data. */
		hash: bigint;
		/** Payload is the data of the blob. When sent, the client will associate the Hash of the blob with the Payload in it. */
		payload: ByteArray;
	};
	/**
	 * BlockProperties is a list of all the custom blocks registered on the server.
	 */
	export type BlockProperties = {
		name: string;
		state: any;
	}[];
	export type Itemstates = {
		name: string;
		runtime_id: number;
		component_based: boolean;
		/** Version is the version of the item entry which is used by the client to determine how to handle the item entry. It is one of the constants above. */
		version: "legacy" | "data_driven" | "none";
		/** Components on the item */
		nbt: any;
	}[];
	export type ItemExtraDataWithBlockingTick = {
		has_nbt: "false" | "true";
		nbt?: {
			version: number;
			nbt: any;
		};
		can_place_on: ShortString[];
		can_destroy: ShortString[];
		blocking_tick: bigint;
	};
	export type ItemExtraDataWithoutBlockingTick = {
		has_nbt: "false" | "true";
		nbt?: {
			version: number;
			nbt: any;
		};
		can_place_on: ShortString[];
		can_destroy: ShortString[];
	};
	/**
	 * Same as below but without a "networkStackID" boolean
	 */
	export type ItemLegacy = {
		network_id: number;
		count?: number;
		metadata?: number;
		block_runtime_id?: number;
		extra?: ItemExtraDataWithBlockingTick | ItemExtraDataWithoutBlockingTick | undefined;
	};
	/**
	 * An "ItemStack" here represents an Item instance. You can think about it like a pointer
	 * to an item class. The data for the class gets updated with the data in the `item` field
	 * As of 1.16.220, now functionally the same as `Item` just without an extra boolean when
	 * server auth inventories is disabled.
	 */
	export type Item = {
		network_id: number;
		count?: number;
		metadata?: number;
		has_stack_id?: number;
		stack_id?: number | undefined;
		block_runtime_id?: number;
		extra?: ItemExtraDataWithBlockingTick | ItemExtraDataWithoutBlockingTick | undefined;
	};
	export type vec3i = {
		x: number;
		y: number;
		z: number;
	};
	export type vec3li = {
		x: number;
		y: number;
		z: number;
	};
	export type vec3u = {
		x: number;
		y: number;
		z: number;
	};
	export type vec3f = {
		x: number;
		y: number;
		z: number;
	};
	export type vec2f = {
		x: number;
		z: number;
	};
	export type Vec3fopts = {
		x?: number;
		y?: number;
		z?: number;
	};
	export type Vec2fopts = {
		x?: number;
		y?: number;
	};
	export type MetadataDictionary = {
		/** https://github.com/pmmp/PocketMine-MP/blob/stable/src/pocketmine/entity/Entity.php#L101 */
		key: "flags" | "health" | "variant" | "color" | "nametag" | "owner_eid" | "target_eid" | "air" | "potion_color" | "potion_ambient" | "jump_duration" | "hurt_time" | "hurt_direction" | "paddle_time_left" | "paddle_time_right" | "experience_value" | "minecart_display_block" | "minecart_display_offset" | "minecart_has_display" | "horse_type" | "creeper_swell" | "creeper_swell_direction" | "charge_amount" | "enderman_held_runtime_id" | "entity_age" | "player_flags" | "player_index" | "player_bed_position" | "fireball_power_x" | "fireball_power_y" | "fireball_power_z" | "aux_power" | "fish_x" | "fish_z" | "fish_angle" | "potion_aux_value" | "lead_holder_eid" | "scale" | "interactive_tag" | "npc_skin_id" | "url_tag" | "max_airdata_max_air" | "mark_variant" | "container_type" | "container_base_size" | "container_extra_slots_per_strength" | "block_target" | "wither_invulnerable_ticks" | "wither_target_1" | "wither_target_2" | "wither_target_3" | "wither_aerial_attack" | "boundingbox_width" | "boundingbox_height" | "fuse_length" | "rider_seat_position" | "rider_rotation_locked" | "rider_max_rotation" | "rider_min_rotation" | "rider_seat_rotation_offset" | "area_effect_cloud_radius" | "area_effect_cloud_waiting" | "area_effect_cloud_particle_id" | "shulker_peek_id" | "shulker_attach_face" | "shulker_attached" | "shulker_attach_pos" | "trading_player_eid" | "trading_career" | "has_command_block" | "command_block_command" | "command_block_last_output" | "command_block_track_output" | "controlling_rider_seat_number" | "strength" | "max_strength" | "evoker_spell_casting_color" | "limited_life" | "armor_stand_pose_index" | "ender_crystal_time_offset" | "always_show_nametag" | "color_2" | "name_author" | "score_tag" | "balloon_attached_entity" | "pufferfish_size" | "bubble_time" | "agent" | "sitting_amount" | "sitting_amount_previous" | "eating_counter" | "flags_extended" | "laying_amount" | "laying_amount_previous" | "area_effect_cloud_duration" | "area_effect_cloud_spawn_time" | "area_effect_cloud_change_rate" | "area_effect_cloud_change_on_pickup" | "area_effect_cloud_pickup_count" | "interact_text" | "trade_tier" | "max_trade_tier" | "trade_experience" | "skin_id" | "spawning_frames" | "command_block_tick_delay" | "command_block_execute_on_first_tick" | "ambient_sound_interval" | "ambient_sound_interval_range" | "ambient_sound_event_name" | "fall_damage_multiplier" | "name_raw_text" | "can_ride_target" | "low_tier_cured_discount" | "high_tier_cured_discount" | "nearby_cured_discount" | "nearby_cured_discount_timestamp" | "hitbox" | "is_buoyant" | "freezing_effect_strength" | "buoyancy_data" | "goat_horn_count" | "update_properties" | "movement_sound_distance_offset" | "heartbeat_interval_ticks" | "heartbeat_sound_event" | "player_last_death_position" | "player_last_death_dimension" | "player_has_died" | "collision_box" | "visible_mob_effects" | "filtered_name" | "bed_enter_position" | "seat_third_person_camera_radius" | "seat_camera_relax_distance_smoothing";
		type: "byte" | "short" | "int" | "float" | "string" | "compound" | "vec3i" | "long" | "vec3f";
		value: MetadataFlags1 | MetadataFlags2 | number | number | string | any | vec3i | bigint | vec3f;
	}[];
	export type MetadataFlags1 = {
		onfire?: boolean;
		sneaking?: boolean;
		riding?: boolean;
		sprinting?: boolean;
		action?: boolean;
		invisible?: boolean;
		tempted?: boolean;
		inlove?: boolean;
		saddled?: boolean;
		powered?: boolean;
		ignited?: boolean;
		baby?: boolean;
		converting?: boolean;
		critical?: boolean;
		can_show_nametag?: boolean;
		always_show_nametag?: boolean;
		no_ai?: boolean;
		silent?: boolean;
		wallclimbing?: boolean;
		can_climb?: boolean;
		swimmer?: boolean;
		can_fly?: boolean;
		walker?: boolean;
		resting?: boolean;
		sitting?: boolean;
		angry?: boolean;
		interested?: boolean;
		charged?: boolean;
		tamed?: boolean;
		orphaned?: boolean;
		leashed?: boolean;
		sheared?: boolean;
		gliding?: boolean;
		elder?: boolean;
		moving?: boolean;
		breathing?: boolean;
		chested?: boolean;
		stackable?: boolean;
		showbase?: boolean;
		rearing?: boolean;
		vibrating?: boolean;
		idling?: boolean;
		evoker_spell?: boolean;
		charge_attack?: boolean;
		wasd_controlled?: boolean;
		can_power_jump?: boolean;
		can_dash?: boolean;
		linger?: boolean;
		has_collision?: boolean;
		affected_by_gravity?: boolean;
		fire_immune?: boolean;
		dancing?: boolean;
		enchanted?: boolean;
		show_trident_rope?: boolean;
		container_private?: boolean;
		transforming?: boolean;
		spin_attack?: boolean;
		swimming?: boolean;
		bribed?: boolean;
		pregnant?: boolean;
		laying_egg?: boolean;
		rider_can_pick?: boolean;
		transition_sitting?: boolean;
		eating?: boolean;
		laying_down?: boolean;
	};
	export type MetadataFlags2 = {
		sneezing?: boolean;
		trusting?: boolean;
		rolling?: boolean;
		scared?: boolean;
		in_scaffolding?: boolean;
		over_scaffolding?: boolean;
		fall_through_scaffolding?: boolean;
		blocking?: boolean;
		transition_blocking?: boolean;
		blocked_using_shield?: boolean;
		blocked_using_damaged_shield?: boolean;
		sleeping?: boolean;
		wants_to_wake?: boolean;
		trade_interest?: boolean;
		door_breaker?: boolean;
		breaking_obstruction?: boolean;
		door_opener?: boolean;
		illager_captain?: boolean;
		stunned?: boolean;
		roaring?: boolean;
		delayed_attacking?: boolean;
		avoiding_mobs?: boolean;
		avoiding_block?: boolean;
		facing_target_to_range_attack?: boolean;
		hidden_when_invisible?: boolean;
		is_in_ui?: boolean;
		stalking?: boolean;
		emoting?: boolean;
		celebrating?: boolean;
		admiring?: boolean;
		celebrating_special?: boolean;
		unknown95?: boolean;
		ram_attack?: boolean;
		playing_dead?: boolean;
		in_ascendable_block?: boolean;
		over_descendable_block?: boolean;
		croaking?: boolean;
		eat_mob?: boolean;
		jump_goal_jump?: boolean;
		emerging?: boolean;
		sniffing?: boolean;
		digging?: boolean;
		sonic_boom?: boolean;
		has_dash_cooldown?: boolean;
		push_towards_closest_space?: boolean;
		scenting?: boolean;
		rising?: boolean;
		feeling_happy?: boolean;
		searching?: boolean;
		crawling?: boolean;
		timer_flag_1?: boolean;
		timer_flag_2?: boolean;
		timer_flag_3?: boolean;
		body_rotation_blocked?: boolean;
		render_when_invisible?: boolean;
		body_rotation_axis_aligned?: boolean;
		collidable?: boolean;
		wasd_air_controlled?: boolean;
		does_server_auth_only_dismount?: boolean;
		body_rotation_always_follows_head?: boolean;
		can_use_vertical_movement_action?: boolean;
		rotation_locked_to_vehicle?: boolean;
	};
	export type Link = {
		ridden_entity_id: bigint;
		rider_entity_id: bigint;
		type: number;
		immediate: boolean;
		rider_initiated: boolean;
		/** angular velocity of the vehicle that the rider is riding. */
		angular_velocity: number;
	};
	export type Links = Link[];
	export type EntityAttributes = {
		name: string;
		min: number;
		value: number;
		max: number;
	}[];
	export type EntityProperties = {
		ints: {
			index: number;
			value: number;
		}[];
		floats: {
			index: number;
			value: number;
		}[];
	};
	export type Rotation = {
		yaw: number;
		pitch: number;
		head_yaw: number;
	};
	export type BlockCoordinates = {
		x: number;
		y: number;
		z: number;
	};
	export type PlayerAttributes = {
		min: number;
		max: number;
		current: number;
		default_min: number;
		default_max: number;
		default: number;
		name: string;
		modifiers: {
			id: string;
			name: string;
			amount: number;
			operation: number;
			operand: number;
			serializable: boolean;
		}[];
	}[];
	/**
	 * UseItemTransactionData represents an inventory transaction data object sent when the client uses an item on
	 * a block. Also used in PlayerAuthoritativeInput packet
	 */
	export type TransactionUseItem = {
		/** ActionType is the type of the UseItem inventory transaction. It is one of the action types found above, and specifies the way the player interacted with the block. */
		action_type: "click_block" | "click_air" | "break_block" | "attack";
		/** TriggerType is the type of the trigger that caused the inventory transaction. It is one of the trigger types found in the constants above. If TriggerType is TriggerTypePlayerInput, the transaction is from the initial input of the player. If it is TriggerTypeSimulationTick, the transaction is from a simulation tick when the player is holding down the input. */
		trigger_type: "unknown" | "player_input" | "simulation_tick";
		/** BlockPosition is the position of the block that was interacted with. This is only really a correct block position if ActionType is not UseItemActionClickAir. */
		block_position: BlockCoordinates;
		/** BlockFace is the face of the block that was interacted with. When clicking the block, it is the face clicked. When breaking the block, it is the face that was last being hit until the block broke. */
		face: number;
		/** HotBarSlot is the hot bar slot that the player was holding while clicking the block. It should be used to ensure that the hot bar slot and held item are correctly synchronised with the server. */
		hotbar_slot: number;
		/** HeldItem is the item that was held to interact with the block. The server should check if this item is actually present in the HotBarSlot. */
		held_item: Item;
		/** Position is the position of the player at the time of interaction. For clicking a block, this is the position at that time, whereas for breaking the block it is the position at the time of breaking. */
		player_pos: vec3f;
		/** ClickedPosition is the position that was clicked relative to the block's base coordinate. It can be used to find out exactly where a player clicked the block. */
		click_pos: vec3f;
		/** BlockRuntimeID is the runtime ID of the block that was clicked. It may be used by the server to verify that the player's world client-side is synchronised with the server's. */
		block_runtime_id: number;
		/** ClientPrediction is the client's prediction on the output of the transaction. */
		client_prediction: "failure" | "success";
	};
	/**
	 * Actions is a list of actions that took place, that form the inventory transaction together. Each of
	 * these actions hold one slot in which one item was changed to another. In general, the combination of
	 * all of these actions results in a balanced inventory transaction. This should be checked to ensure that
	 * no items are cheated into the inventory.
	 */
	export type TransactionActions = {
		source_type: "container" | "global" | "world_interaction" | "creative" | "craft_slot" | "craft";
		inventory_id?: WindowIDVarint;
		action?: number;
		flags?: number;
		slot: number;
		old_item: Item;
		new_item: Item;
	}[];
	/**
	 * The Minecraft bedrock inventory system was refactored, but not all inventory actions use the new packet.
	 * This data structure holds actions that have not been updated to the new system.
	 */
	export type TransactionLegacy = {
		/** LegacyRequestID is an ID that is only non-zero at times when sent by the client. The server should always send 0 for this. When this field is not 0, the LegacySetItemSlots slice below will have values in it. LegacyRequestID ties in with the ItemStackResponse packet. If this field is non-0, the server should respond with an ItemStackResponse packet. Some inventory actions such as dropping an item out of the hotbar are still one using this packet, and the ItemStackResponse packet needs to tie in with it. */
		legacy_request_id: number;
		/** `legacy_transactions` are only present if the LegacyRequestID is non-zero. These item slots inform the server of the slots that were changed during the inventory transaction, and the server should send back an ItemStackResponse packet with these slots present in it. (Or false with no slots, if rejected.) */
		legacy_transactions?: {
			container_id: number;
			changed_slots: {
				slot_id: number;
			}[];
		}[];
	};
	export type Transaction = {
		/** Old transaction system data */
		legacy: TransactionLegacy;
		/** What type of transaction took place */
		transaction_type: "normal" | "inventory_mismatch" | "item_use" | "item_use_on_entity" | "item_release";
		/** The list of inventory internal actions in this packet, e.g. inventory GUI actions */
		actions: TransactionActions;
		/** Extra data if an intenal inventory transaction did not take place, e.g. use of an item */
		transaction_data: TransactionUseItem | {
			entity_runtime_id: bigint;
			action_type: "interact" | "attack";
			hotbar_slot: number;
			held_item: Item;
			player_pos: vec3f;
			click_pos: vec3f;
		} | {
			action_type: "release" | "consume";
			hotbar_slot: number;
			held_item: Item;
			head_pos: vec3f;
		};
	};
	export type ItemStacks = Item[];
	export type RecipeIngredient = {
		type: "invalid" | "int_id_meta" | "molang" | "item_tag" | "string_id_meta" | "complex_alias";
		network_id?: number;
		metadata?: number | undefined | number;
		expression?: string;
		version?: number;
		tag?: string;
		name?: string;
		count: number;
	};
	export type PotionTypeRecipes = {
		input_item_id: number;
		input_item_meta: number;
		ingredient_id: number;
		ingredient_meta: number;
		output_item_id: number;
		output_item_meta: number;
	}[];
	export type PotionContainerChangeRecipes = {
		input_item_id: number;
		ingredient_id: number;
		output_item_id: number;
	}[];
	export type Recipes = {
		type: "shapeless" | "shaped" | "furnace" | "furnace_with_metadata" | "multi" | "shulker_box" | "shapeless_chemistry" | "shaped_chemistry" | "smithing_transform" | "smithing_trim";
		recipe: {
			recipe_id: LatinString;
			input: RecipeIngredient[];
			output: ItemLegacy[];
			uuid: string;
			block: string;
			priority: number;
			unlocking_requirement: RecipeUnlockingRequirement;
			network_id: number;
		} | {
			recipe_id: LatinString;
			width: number;
			height: number;
			input: RecipeIngredient[][];
			output: ItemLegacy[];
			uuid: string;
			block: string;
			priority: number;
			assume_symmetry: boolean;
			unlocking_requirement: RecipeUnlockingRequirement;
			network_id: number;
		} | {
			input_id: number;
			output: ItemLegacy;
			block: string;
		} | {
			input_id: number;
			input_meta: number;
			output: ItemLegacy;
			block: string;
		} | {
			uuid: string;
			network_id: number;
		} | {
			recipe_id: LatinString;
			template: RecipeIngredient;
			base: RecipeIngredient;
			addition: RecipeIngredient;
			result: ItemLegacy;
			tag: string;
			network_id: number;
		} | {
			recipe_id: LatinString;
			template: RecipeIngredient;
			input: RecipeIngredient;
			addition: RecipeIngredient;
			block: string;
			network_id: number;
		};
	}[];
	export type RecipeUnlockingRequirement = {
		context: "none" | "always_unlocked" | "player_in_water" | "player_has_many_items";
		ingredients?: RecipeIngredient[];
	};
	export type SkinImage = {
		width: number;
		height: number;
		data: ByteArray;
	};
	export type Skin = {
		skin_id: string;
		play_fab_id: string;
		skin_resource_pack: string;
		skin_data: SkinImage;
		animations: {
			skin_image: SkinImage;
			animation_type: number;
			animation_frames: number;
			expression_type: number;
		}[];
		cape_data: SkinImage;
		geometry_data: string;
		geometry_data_version: string;
		animation_data: string;
		cape_id: string;
		full_skin_id: string;
		arm_size: string;
		skin_color: string;
		personal_pieces: {
			piece_id: string;
			piece_type: string;
			pack_id: string;
			is_default_piece: boolean;
			product_id: string;
		}[];
		piece_tint_colors: {
			piece_type: string;
			colors: string[];
		}[];
		premium: boolean;
		persona: boolean;
		cape_on_classic: boolean;
		primary_user: boolean;
		overriding_player_appearance: boolean;
	};
	export type PlayerRecords = {
		type: "add" | "remove";
		records_count: number;
		records: {
			uuid: string;
			entity_unique_id: bigint;
			username: string;
			xbox_user_id: string;
			platform_chat_id: string;
			build_platform: number;
			skin_data: Skin;
			is_teacher: boolean;
			is_host: boolean;
			is_subclient: boolean;
			player_color: number;
		} | {
			uuid: string;
		}[];
		verified?: boolean[];
	};
	export type Enchant = {
		id: number;
		level: number;
	};
	export type EnchantOption = {
		cost: number;
		slot_flags: number;
		equip_enchants: Enchant[];
		held_enchants: Enchant[];
		self_enchants: Enchant[];
		name: string;
		option_id: number;
	};
	export type Action = "start_break" | "abort_break" | "stop_break" | "get_updated_block" | "drop_item" | "start_sleeping" | "stop_sleeping" | "respawn" | "jump" | "start_sprint" | "stop_sprint" | "start_sneak" | "stop_sneak" | "creative_player_destroy_block" | "dimension_change_ack" | "start_glide" | "stop_glide" | "build_denied" | "crack_break" | "change_skin" | "set_enchatnment_seed" | "swimming" | "stop_swimming" | "start_spin_attack" | "stop_spin_attack" | "interact_block" | "predict_break" | "continue_break" | "start_item_use_on" | "stop_item_use_on" | "handled_teleport" | "missed_swing" | "start_crawling" | "stop_crawling" | "start_flying" | "stop_flying" | "received_server_data" | "start_using_item";
	/**
	 * Source and Destination point to the source slot from which Count of the item stack were taken and the
	 * destination slot to which this item was moved.
	 */
	export type StackRequestSlotInfo = {
		/** ContainerID is the ID of the container that the slot was in. */
		slot_type: FullContainerName;
		/** Slot is the index of the slot within the container with the ContainerID above. */
		slot: number;
		/** StackNetworkID is the unique stack ID that the client assumes to be present in this slot. The server must check if these IDs match. If they do not match, servers should reject the stack request that the action holding this info was in. */
		stack_id: number;
	};
	/**
	 * ItemStackRequest is sent by the client to change item stacks in an inventory. It is essentially a
	 * replacement of the InventoryTransaction packet added in 1.16 for inventory specific actions, such as moving
	 * items around or crafting. The InventoryTransaction packet is still used for actions such as placing blocks
	 * and interacting with entities.
	 */
	export type ItemStackRequest = {
		/** RequestID is a unique ID for the request. This ID is used by the server to send a response for this specific request in the ItemStackResponse packet. */
		request_id: number;
		actions: {
			type_id: "take" | "place" | "swap" | "drop" | "destroy" | "consume" | "create" | "place_in_container" | "take_out_container" | "lab_table_combine" | "beacon_payment" | "mine_block" | "craft_recipe" | "craft_recipe_auto" | "craft_creative" | "optional" | "craft_grindstone_request" | "craft_loom_request" | "non_implemented" | "results_deprecated";
			count?: number;
			source?: StackRequestSlotInfo;
			destination?: StackRequestSlotInfo;
			randomly?: boolean;
			result_slot_id?: number;
			primary_effect?: number;
			secondary_effect?: number;
			hotbar_slot?: number;
			predicted_durability?: number;
			network_id?: number;
			recipe_network_id?: number;
			times_crafted?: number;
			times_crafted_2?: number;
			ingredients?: RecipeIngredient[];
			item_id?: number;
			filtered_string_index?: number;
			cost?: number;
			pattern?: string;
			result_items?: ItemLegacy[];
		}[];
		custom_names: string[];
		cause: "chat_public" | "chat_whisper" | "sign_text" | "anvil_text" | "book_and_quill_text" | "command_block_text" | "block_actor_data_text" | "join_event_text" | "leave_event_text" | "slash_command_chat" | "cartography_text" | "kick_command" | "title_command" | "summon_command";
	};
	/**
	 * ItemStackResponse is a response to an individual ItemStackRequest.
	 */
	export type ItemStackResponses = {
		/** Status specifies if the request with the RequestID below was successful. If this is the case, the ContainerInfo below will have information on what slots ended up changing. If not, the container info will be empty. A non-0 status means an error occurred and will result in the action being reverted. */
		status: "ok" | "error";
		/** RequestID is the unique ID of the request that this response is in reaction to. If rejected, the client will undo the actions from the request with this ID. */
		request_id: number;
		containers?: {
			slot_type: FullContainerName;
			slots: {
				slot: number;
				hotbar_slot: number;
				count: number;
				item_stack_id: number;
				custom_name: string;
				filtered_custom_name: string;
				durability_correction: number;
			}[];
		}[];
	}[];
	export type CommandOrigin = {
		/** Origin is one of the values above that specifies the origin of the command. The origin may change, depending on what part of the client actually called the command. The command may be issued by a websocket server, for example. */
		type: string;
		uuid: string;
		request_id: string;
		player_entity_id: bigint;
	};
	/**
	 * MapTrackedObject is an object on a map that is 'tracked' by the client, such as an entity or a block. This
	 * object may move, which is handled client-side.
	 */
	export type TrackedObject = {
		/** Type is the type of the tracked object. It is either MapObjectTypeEntity or MapObjectTypeBlock. */
		type: "entity" | "block";
		/** EntityUniqueID is the unique ID of the entity, if the tracked object was an entity. It needs not to be filled out if Type is not MapObjectTypeEntity. */
		entity_unique_id?: bigint;
		/** BlockPosition is the position of the block, if the tracked object was a block. It needs not to be filled out if Type is not MapObjectTypeBlock. */
		block_position?: BlockCoordinates;
	};
	/**
	 * MapDecoration is a fixed decoration on a map: Its position or other properties do not change automatically
	 * client-side.
	 */
	export type MapDecoration = {
		type: "marker_white" | "marker_green" | "marker_red" | "marker_blue" | "cross_white" | "triangle_red" | "square_white" | "marker_sign" | "marker_pink" | "marker_orange" | "marker_yellow" | "marker_teal" | "triangle_green" | "small_square_white" | "mansion" | "monument" | "no_draw" | "village_desert" | "village_plains" | "village_savanna" | "village_snowy" | "village_taiga" | "jungle_temple" | "witch_hut =>" | "witch_hut";
		/** Rotation is the rotation of the map decoration. It is byte due to the 16 fixed directions that the map decoration may face. */
		rotation: number;
		/** X is the offset on the X axis in pixels of the decoration. */
		x: number;
		/** Y is the offset on the Y axis in pixels of the decoration. */
		y: number;
		/** Label is the name of the map decoration. This name may be of any value. */
		label: string;
		/** Colour is the colour of the map decoration. Some map decoration types have a specific colour set automatically, whereas others may be changed. */
		color_abgr: number;
	};
	export type StructureBlockSettings = {
		/** PaletteName is the name of the palette used in the structure. Currently, it seems that this field is always 'default'. */
		palette_name: string;
		/** IgnoreEntities specifies if the structure should ignore entities or include them. If set to false, entities will also show up in the exported structure. */
		ignore_entities: boolean;
		/** IgnoreBlocks specifies if the structure should ignore blocks or include them. If set to false, blocks will show up in the exported structure. */
		ignore_blocks: boolean;
		non_ticking_players_and_ticking_areas: boolean;
		/** Size is the size of the area that is about to be exported. The area exported will start at the Position + Offset, and will extend as far as Size specifies. */
		size: BlockCoordinates;
		/** Offset is the offset position that was set in the structure block. The area exported is offset by this position. **TODO**: This will be renamed to offset soon */
		structure_offset: BlockCoordinates;
		/** LastEditingPlayerUniqueID is the unique ID of the player that last edited the structure block that these settings concern. */
		last_editing_player_unique_id: bigint;
		/** Rotation is the rotation that the structure block should obtain. See the constants above for available options. */
		rotation: "none" | "90_deg" | "180_deg" | "270_deg";
		/** Mirror specifies the way the structure should be mirrored. It is either no mirror at all, mirror on the x/z axis or both. */
		mirror: "none" | "x_axis" | "z_axis" | "both_axes";
		animation_mode: "none" | "layers" | "blocks";
		/** How long the duration for this animation is */
		animation_duration: number;
		/** Integrity is usually 1, but may be set to a number between 0 and 1 to omit blocks randomly, using the Seed that follows. */
		integrity: number;
		/** Seed is the seed used to omit blocks if Integrity is not equal to one. If the Seed is 0, a random seed is selected to omit blocks. */
		seed: number;
		/** Pivot is the pivot around which the structure may be rotated. */
		pivot: vec3f;
	};
	/**
	 * EducationSharedResourceURI is an education edition feature that is used for transmitting
	 * education resource settings to clients. It contains a button name and a link URL.
	 */
	export type EducationSharedResourceURI = {
		/** ButtonName is the button name of the resource URI. */
		button_name: string;
		/** LinkURI is the link URI for the resource URI. */
		link_uri: string;
	};
	export type EducationExternalLinkSettings = {
		/** URL is the external link URL. */
		url: string;
		/** DisplayName is the display name in game. */
		display_name: string;
	};
	export type BlockUpdate = {
		position: BlockCoordinates;
		runtime_id: number;
		flags: number;
		/** EntityUniqueID is the unique ID of the falling block entity that the block transitions to or that the entity transitions from. Note that for both possible values for TransitionType, the EntityUniqueID should point to the falling block entity involved. */
		entity_unique_id: bigint;
		/** TransitionType is the type of the transition that happened. It is either BlockToEntityTransition, when a block placed becomes a falling entity, or EntityToBlockTransition, when a falling entity hits the ground and becomes a solid block again. */
		transition_type: "entity" | "create" | "destroy";
	};
	export type MaterialReducer = {
		mix: number;
		items: {
			network_id: number;
			count: number;
		};
	};
	/**
	 * # Permissions
	 * The permission level of a player, for example whether they are an Server Operator or not.
	 */
	export type PermissionLevel = "visitor" | "member" | "operator" | "custom";
	/**
	 * The command permission level, for example if being run by a Player, an Op, or a Command Block.
	 */
	export type CommandPermissionLevel = "normal" | "operator" | "automation" | "host" | "owner" | "internal";
	/**
	 * The command permission level, for example if being run by a Player, an Op, or a Command Block.
	 */
	export type CommandPermissionLevelVarint = "normal" | "operator" | "automation" | "host" | "owner" | "internal";
	/**
	 * List of Window IDs. When a new container is opened (container_open), a new sequential Window ID is created.
	 * Below window IDs are hard-coded and created when the game starts and the server does not
	 * send a `container_open` for them.
	 */
	export type WindowID = "inventory" | "first" | "last" | "offhand" | "armor" | "creative" | "hotbar" | "fixed_inventory" | "ui" | "drop_contents" | "beacon" | "trading_output" | "trading_use_inputs" | "trading_input_2" | "trading_input_1" | "enchant_output" | "enchant_material" | "enchant_input" | "anvil_output" | "anvil_result" | "anvil_material" | "container_input" | "crafting_use_ingredient" | "crafting_result" | "crafting_remove_ingredient" | "crafting_add_ingredient" | "none";
	export type WindowIDVarint = "inventory" | "first" | "last" | "offhand" | "armor" | "creative" | "hotbar" | "fixed_inventory" | "ui" | "drop_contents" | "beacon" | "trading_output" | "trading_use_inputs" | "trading_input_2" | "trading_input_1" | "enchant_output" | "enchant_material" | "enchant_input" | "anvil_output" | "anvil_result" | "anvil_material" | "container_input" | "crafting_use_ingredient" | "crafting_result" | "crafting_remove_ingredient" | "crafting_add_ingredient" | "none";
	export type WindowType = "container" | "workbench" | "furnace" | "enchantment" | "brewing_stand" | "anvil" | "dispenser" | "dropper" | "hopper" | "cauldron" | "minecart_chest" | "minecart_hopper" | "horse" | "beacon" | "structure_editor" | "trading" | "command_block" | "jukebox" | "armor" | "hand" | "compound_creator" | "element_constructor" | "material_reducer" | "lab_table" | "loom" | "lectern" | "grindstone" | "blast_furnace" | "smoker" | "stonecutter" | "cartography" | "hud" | "jigsaw_editor" | "smithing_table" | "chest_boat" | "decorated_pot" | "crafter" | "none" | "inventory";
	/**
	 * Used in inventory transactions.
	 */
	export type ContainerSlotType = "anvil_input" | "anvil_material" | "anvil_result" | "smithing_table_input" | "smithing_table_material" | "smithing_table_result" | "armor" | "container" | "beacon_payment" | "brewing_input" | "brewing_result" | "brewing_fuel" | "hotbar_and_inventory" | "crafting_input" | "crafting_output" | "recipe_construction" | "recipe_nature" | "recipe_items" | "recipe_search" | "recipe_search_bar" | "recipe_equipment" | "recipe_book" | "enchanting_input" | "enchanting_lapis" | "furnace_fuel" | "furnace_ingredient" | "furnace_output" | "horse_equip" | "hotbar" | "inventory" | "shulker" | "trade_ingredient1" | "trade_ingredient2" | "trade_result" | "offhand" | "compcreate_input" | "compcreate_output" | "elemconstruct_output" | "matreduce_input" | "matreduce_output" | "labtable_input" | "loom_input" | "loom_dye" | "loom_material" | "loom_result" | "blast_furnace_ingredient" | "smoker_ingredient" | "trade2_ingredient1" | "trade2_ingredient2" | "trade2_result" | "grindstone_input" | "grindstone_additional" | "grindstone_result" | "stonecutter_input" | "stonecutter_result" | "cartography_input" | "cartography_additional" | "cartography_result" | "barrel" | "cursor" | "creative_output" | "smithing_table_template" | "crafter" | "dynamic" | "registry";
	export type SoundType = "ItemUseOn" | "Hit" | "Step" | "Fly" | "Jump" | "Break" | "Place" | "HeavyStep" | "Gallop" | "Fall" | "Ambient" | "AmbientBaby" | "AmbientInWater" | "Breathe" | "Death" | "DeathInWater" | "DeathToZombie" | "Hurt" | "HurtInWater" | "Mad" | "Boost" | "Bow" | "SquishBig" | "SquishSmall" | "FallBig" | "FallSmall" | "Splash" | "Fizz" | "Flap" | "Swim" | "Drink" | "Eat" | "Takeoff" | "Shake" | "Plop" | "Land" | "Saddle" | "Armor" | "ArmorStandPlace" | "AddChest" | "Throw" | "Attack" | "AttackNoDamage" | "AttackStrong" | "Warn" | "Shear" | "Milk" | "Thunder" | "Explode" | "Fire" | "Ignite" | "Fuse" | "Stare" | "Spawn" | "Shoot" | "BreakBlock" | "Launch" | "Blast" | "LargeBlast" | "Twinkle" | "Remedy" | "Unfect" | "LevelUp" | "BowHit" | "BulletHit" | "ExtinguishFire" | "ItemFizz" | "ChestOpen" | "ChestClosed" | "ShulkerBoxOpen" | "ShulkerBoxClosed" | "EnderChestOpen" | "EnderChestClosed" | "PowerOn" | "PowerOff" | "Attach" | "Detach" | "Deny" | "Tripod" | "Pop" | "DropSlot" | "Note" | "Thorns" | "PistonIn" | "PistonOut" | "Portal" | "Water" | "LavaPop" | "Lava" | "Burp" | "BucketFillWater" | "BucketFillLava" | "BucketEmptyWater" | "BucketEmptyLava" | "ArmorEquipChain" | "ArmorEquipDiamond" | "ArmorEquipGeneric" | "ArmorEquipGold" | "ArmorEquipIron" | "ArmorEquipLeather" | "ArmorEquipElytra" | "Record13" | "RecordCat" | "RecordBlocks" | "RecordChirp" | "RecordFar" | "RecordMall" | "RecordMellohi" | "RecordStal" | "RecordStrad" | "RecordWard" | "Record11" | "RecordWait" | "StopRecord" | "Flop" | "GuardianCurse" | "MobWarning" | "MobWarningBaby" | "Teleport" | "ShulkerOpen" | "ShulkerClose" | "Haggle" | "HaggleYes" | "HaggleNo" | "HaggleIdle" | "ChorusGrow" | "ChorusDeath" | "Glass" | "PotionBrewed" | "CastSpell" | "PrepareAttackSpell" | "PrepareSummon" | "PrepareWololo" | "Fang" | "Charge" | "CameraTakePicture" | "LeashKnotPlace" | "LeashKnotBreak" | "AmbientGrowl" | "AmbientWhine" | "AmbientPant" | "AmbientPurr" | "AmbientPurreow" | "DeathMinVolume" | "DeathMidVolume" | "ImitateBlaze" | "ImitateCaveSpider" | "ImitateCreeper" | "ImitateElderGuardian" | "ImitateEnderDragon" | "ImitateEnderman" | "ImitateEndermite" | "ImitateEvocationIllager" | "ImitateGhast" | "ImitateHusk" | "ImitateIllusionIllager" | "ImitateMagmaCube" | "ImitatePolarBear" | "ImitateShulker" | "ImitateSilverfish" | "ImitateSkeleton" | "ImitateSlime" | "ImitateSpider" | "ImitateStray" | "ImitateVex" | "ImitateVindicationIllager" | "ImitateWitch" | "ImitateWither" | "ImitateWitherSkeleton" | "ImitateWolf" | "ImitateZombie" | "ImitateZombiePigman" | "ImitateZombieVillager" | "EnderEyePlaced" | "EndPortalCreated" | "AnvilUse" | "BottleDragonBreath" | "PortalTravel" | "TridentHit" | "TridentReturn" | "TridentRiptide1" | "TridentRiptide2" | "TridentRiptide3" | "TridentThrow" | "TridentThunder" | "TridentHitGround" | "Default" | "FletchingTableUse" | "ElemConstructOpen" | "IceBombHit" | "BalloonPop" | "LtReactionIceBomb" | "LtReactionBleach" | "LtReactionElephantToothpaste" | "LtReactionElephantToothpaste2" | "LtReactionGlowStick" | "LtReactionGlowStick2" | "LtReactionLuminol" | "LtReactionSalt" | "LtReactionFertilizer" | "LtReactionFireball" | "LtReactionMagnesiumSalt" | "LtReactionMiscFire" | "LtReactionFire" | "LtReactionMiscExplosion" | "LtReactionMiscMystical" | "LtReactionMiscMystical2" | "LtReactionProduct" | "SparklerUse" | "GlowStickUse" | "SparklerActive" | "ConvertToDrowned" | "BucketFillFish" | "BucketEmptyFish" | "BubbleColumnUpwards" | "BubbleColumnDownwards" | "BubblePop" | "BubbleUpInside" | "BubbleDownInside" | "HurtBaby" | "DeathBaby" | "StepBaby" | "SpawnBaby" | "Born" | "TurtleEggBreak" | "TurtleEggCrack" | "TurtleEggHatched" | "LayEgg" | "TurtleEggAttacked" | "BeaconActivate" | "BeaconAmbient" | "BeaconDeactivate" | "BeaconPower" | "ConduitActivate" | "ConduitAmbient" | "ConduitAttack" | "ConduitDeactivate" | "ConduitShort" | "Swoop" | "BambooSaplingPlace" | "PreSneeze" | "Sneeze" | "AmbientTame" | "Scared" | "ScaffoldingClimb" | "CrossbowLoadingStart" | "CrossbowLoadingMiddle" | "CrossbowLoadingEnd" | "CrossbowShoot" | "CrossbowQuickChargeStart" | "CrossbowQuickChargeMiddle" | "CrossbowQuickChargeEnd" | "AmbientAggressive" | "AmbientWorried" | "CantBreed" | "ShieldBlock" | "LecternBookPlace" | "GrindstoneUse" | "Bell" | "CampfireCrackle" | "Roar" | "Stun" | "SweetBerryBushHurt" | "SweetBerryBushPick" | "CartographyTableUse" | "StonecutterUse" | "ComposterEmpty" | "ComposterFill" | "ComposterFillLayer" | "ComposterReady" | "BarrelOpen" | "BarrelClose" | "RaidHorn" | "LoomUse" | "AmbientInRaid" | "UicartographyTableUse" | "UistonecutterUse" | "UiloomUse" | "SmokerUse" | "BlastFurnaceUse" | "SmithingTableUse" | "Screech" | "Sleep" | "FurnaceUse" | "MooshroomConvert" | "MilkSuspiciously" | "Celebrate" | "JumpPrevent" | "AmbientPollinate" | "BeehiveDrip" | "BeehiveEnter" | "BeehiveExit" | "BeehiveWork" | "BeehiveShear" | "HoneybottleDrink" | "AmbientCave" | "Retreat" | "ConvertToZombified" | "Admire" | "StepLava" | "Tempt" | "Panic" | "Angry" | "AmbientMoodWarpedForest" | "AmbientMoodSoulsandValley" | "AmbientMoodNetherWastes" | "AmbientMoodBasaltDeltas" | "AmbientMoodCrimsonForest" | "RespawnAnchorCharge" | "RespawnAnchorDeplete" | "RespawnAnchorSetSpawn" | "RespawnAnchorAmbient" | "SoulEscapeQuiet" | "SoulEscapeLoud" | "RecordPigstep" | "LinkCompassToLodestone" | "UseSmithingTable" | "EquipNetherite" | "AmbientLoopWarpedForest" | "AmbientLoopSoulsandValley" | "AmbientLoopNetherWastes" | "AmbientLoopBasaltDeltas" | "AmbientLoopCrimsonForest" | "AmbientAdditionWarpedForest" | "AmbientAdditionSoulsandValley" | "AmbientAdditionNetherWastes" | "AmbientAdditionBasaltDeltas" | "AmbientAdditionCrimsonForest" | "SculkSensorPowerOn" | "SculkSensorPowerOff" | "BucketFillPowderSnow" | "BucketEmptyPowderSnow" | "PointedDripstoneCauldronDripWater" | "PointedDripstoneCauldronDripLava" | "PointedDripstoneDripWater" | "PointedDripstoneDripLava" | "CaveVinesPickBerries" | "BigDripleafTiltDown" | "BigDripleafTiltUp" | "CopperWaxOn" | "CopperWaxOff" | "Scrape" | "PlayerHurtDrown" | "PlayerHurtOnFire" | "PlayerHurtFreeze" | "UseSpyglass" | "StopUsingSpyglass" | "AmethystBlockChime" | "AmbientScreamer" | "HurtScreamer" | "DeathScreamer" | "MilkScreamer" | "JumpToBlock" | "PreRam" | "PreRamScreamer" | "RamImpact" | "RamImpactScreamer" | "SquidInkSquirt" | "GlowSquidInkSquirt" | "ConvertToStray" | "CakeAddCandle" | "ExtinguishCandle" | "AmbientCandle" | "BlockClick" | "BlockClickFail" | "SculkCatalystBloom" | "SculkShriekerShriek" | "WardenNearbyClose" | "WardenNearbyCloser" | "WardenNearbyClosest" | "WardenSlightlyAngry" | "RecordOtherside" | "Tongue" | "CrackIronGolem" | "RepairIronGolem" | "Listening" | "Heartbeat" | "HornBreak" | "_" | "SculkSpread" | "SculkCharge" | "SculkSensorPlace" | "SculkShriekerPlace" | "GoatCall0" | "GoatCall1" | "GoatCall2" | "GoatCall3" | "GoatCall4" | "GoatCall5" | "GoatCall6" | "GoatCall7" | "GoatCall8" | "GoatCall9" | "GoatHarmony0" | "GoatHarmony1" | "GoatHarmony2" | "GoatHarmony3" | "GoatHarmony4" | "GoatHarmony5" | "GoatHarmony6" | "GoatHarmony7" | "GoatHarmony8" | "GoatHarmony9" | "GoatMelody0" | "GoatMelody1" | "GoatMelody2" | "GoatMelody3" | "GoatMelody4" | "GoatMelody5" | "GoatMelody6" | "GoatMelody7" | "GoatMelody8" | "GoatMelody9" | "GoatBass0" | "GoatBass1" | "GoatBass2" | "GoatBass3" | "GoatBass4" | "GoatBass5" | "GoatBass6" | "GoatBass7" | "GoatBass8" | "GoatBass9" | "ImitateWarden" | "ListeningAngry" | "ItemGiven" | "ItemTaken" | "Disappeared" | "Reappeared" | "DrinkMilk" | "FrogspawnHatched" | "LaySpawn" | "FrogspawnBreak" | "SonicBoom" | "SonicCharge" | "SoundeventItemThrown" | "Record5" | "ConvertToFrog" | "RecordPlaying" | "EnchantingTableUse" | "StepSand" | "DashReady" | "BundleDropContents" | "BundleInsert" | "BundleRemoveOne" | "PressurePlateClickOff" | "PressurePlateClickOn" | "ButtonClickOff" | "ButtonClickOn" | "DoorOpen" | "DoorClose" | "TrapdoorOpen" | "TrapdoorClose" | "FenceGateOpen" | "FenceGateClose" | "Insert" | "Pickup" | "InsertEnchanted" | "PickupEnchanted" | "Brush" | "BrushCompleted" | "ShatterDecoratedPot" | "BreakDecoratedPot" | "SnifferEggCrack" | "SnifferEggHatched" | "WaxedSignInteractFail" | "RecordRelic" | "Bump" | "PumpkinCarve" | "ConvertHuskToZombie" | "PigDeath" | "HoglinZombified" | "AmbientUnderwaterEnter" | "AmbientUnderwaterExit" | "BottleFill" | "BottleEmpty" | "CrafterCraft" | "CrafterFail" | "DecoratedPotInsert" | "DecoratedPotInsertFail" | "CrafterDisableSlot" | "TrialSpawnerOpenShutter" | "TrialSpawnerEjectItem" | "TrialSpawnerDetectPlayer" | "TrialSpawnerSpawnMob" | "TrialSpawnerCloseShutter" | "TrialSpawnerAmbient" | "CopperBulbTurnOn" | "CopperBulbTurnOff" | "AmbientInAir" | "BreezeWindChargeBurst" | "ImitateBreeze" | "ArmadilloBrush" | "ArmadilloScuteDrop" | "EquipWolf" | "UnequipWolf" | "Reflect" | "VaultOpenShutter" | "VaultCloseShutter" | "VaultEjectItem" | "VaultInsertItem" | "VaultInsertItemFail" | "VaultAmbient" | "VaultActivate" | "VaultDeactive" | "HurtReduced" | "WindChargeBurst" | "ImitateBogged" | "WolfArmourCrack" | "WolfArmourBreak" | "WolfArmourRepair" | "MaceSmashAir" | "MaceSmashGround" | "TrialSpawnerChargeActivate" | "TrialSpawnerAmbientOminous" | "OminiousItemSpawnerSpawnItem" | "OminousBottleEndUse" | "MaceHeavySmashGround" | "OminousItemSpawnerSpawnItemBegin" | "ApplyEffectBadOmen" | "ApplyEffectRaidOmen" | "ApplyEffectTrialOmen" | "OminousItemSpawnerAboutToSpawnItem" | "RecordCreator" | "RecordCreatorMusicBox" | "RecordPrecipice" | "VaultRejectRewardedPlayer" | "ImitateDrowned" | "ImitateCreaking" | "BundleInsertFailed" | "SpongeAbsorb" | "BlockCreakingHeartTrail" | "CreakingHeartSpawn" | "Activate" | "Deactivate" | "Freeze" | "Unfreeze" | "Open" | "OpenLong" | "Close" | "CloseLong" | "ImitatePhantom" | "ImitateZoglin" | "ImitateGuardian" | "ImitateRavager" | "ImitatePillager" | "PlaceInWater" | "StateChange" | "ImitateHappyGhast" | "UniqueGeneric" | "RecordTears" | "TheEndLightFlash" | "LeadLeash" | "LeadUnleash" | "LeadBreak" | "Unsaddle" | "EquipCopper" | "RecordLavaChicken" | "PlaceItem" | "SingleItemSwap" | "MultiItemSwap" | "ItemEnchantLunge1" | "ItemEnchantLunge2" | "ItemEnchantLunge3" | "AttackCritical" | "ItemSpearAttackHit" | "ItemSpearAttackMiss" | "ItemWoodenSpearAttackHit" | "ItemWoodenSpearAttackMiss" | "ImitateParched" | "ImitateCamelHusk" | "ItemSpearUse" | "ItemWoodenSpearUse";
	/**
	 * TODO: remove?
	 */
	export type LegacyEntityType = "chicken" | "cow" | "pig" | "sheep" | "wolf" | "villager" | "mooshroom" | "squid" | "rabbit" | "bat" | "iron_golem" | "snow_golem" | "ocelot" | "horse" | "donkey" | "mule" | "skeleton_horse" | "zombie_horse" | "polar_bear" | "llama" | "parrot" | "dolphin" | "zombie" | "creeper" | "skeleton" | "spider" | "zombie_pigman" | "slime" | "enderman" | "silverfish" | "cave_spider" | "ghast" | "magma_cube" | "blaze" | "zombie_villager" | "witch" | "stray" | "husk" | "wither_skeleton" | "guardian" | "elder_guardian" | "npc" | "wither" | "ender_dragon" | "shulker" | "endermite" | "agent" | "vindicator" | "phantom" | "armor_stand" | "tripod_camera" | "player" | "item" | "tnt" | "falling_block" | "moving_block" | "xp_bottle" | "xp_orb" | "eye_of_ender_signal" | "ender_crystal" | "fireworks_rocket" | "thrown_trident" | "turtle" | "cat" | "shulker_bullet" | "fishing_hook" | "chalkboard" | "dragon_fireball" | "arrow" | "snowball" | "egg" | "painting" | "minecart" | "fireball" | "splash_potion" | "ender_pearl" | "leash_knot" | "wither_skull" | "boat" | "wither_skull_dangerous" | "lightning_bolt" | "small_fireball" | "area_effect_cloud" | "hopper_minecart" | "tnt_minecart" | "chest_minecart" | "command_block_minecart" | "lingering_potion" | "llama_spit" | "evocation_fang" | "evocation_illager" | "vex" | "ice_bomb" | "balloon" | "pufferfish" | "salmon" | "drowned" | "tropicalfish" | "cod" | "panda";
	export type DeviceOS = "Undefined" | "Android" | "IOS" | "OSX" | "FireOS" | "GearVR" | "Hololens" | "Win10" | "Win32" | "Dedicated" | "TVOS" | "Orbis" | "NintendoSwitch" | "Xbox" | "WindowsPhone" | "Linux";
	export type AbilitySet = {
		build?: boolean;
		mine?: boolean;
		doors_and_switches?: boolean;
		open_containers?: boolean;
		attack_players?: boolean;
		attack_mobs?: boolean;
		operator_commands?: boolean;
		teleport?: boolean;
		invulnerable?: boolean;
		flying?: boolean;
		may_fly?: boolean;
		instant_build?: boolean;
		lightning?: boolean;
		fly_speed?: boolean;
		walk_speed?: boolean;
		muted?: boolean;
		world_builder?: boolean;
		no_clip?: boolean;
		privileged_builder?: boolean;
		vertical_fly_speed?: boolean;
		count?: boolean;
	};
	/**
	 * AbilityLayer represents the abilities of a specific layer, such as the base layer or the spectator layer.
	 */
	export type AbilityLayers = {
		/** Type represents the type of the layer. This is one of the AbilityLayerType constants defined above. */
		type: "cache" | "base" | "spectator" | "commands" | "editor" | "loading_screen";
		/** The abilities that can be toggled between */
		allowed: AbilitySet;
		/** The abilities that are currently active */
		enabled: AbilitySet;
		/** FlySpeed is the default horizontal fly speed of the layer. */
		fly_speed: number;
		/** VerticalFlySpeed is the default vertical fly speed of the layer. */
		vertical_fly_speed: number;
		/** WalkSpeed is the default walk speed of the layer. */
		walk_speed: number;
	};
	export type CameraPresets = {
		/** Name is the name of the preset. Each preset must have their own unique name. */
		name: string;
		/** Parent is the name of the preset that this preset extends upon. This can be left empty. */
		parent: string;
		position: Vec3fopts;
		rotation: Vec2fopts;
		rotation_speed?: number;
		snap_to_target?: boolean;
		horizontal_rotation_limit?: vec2f;
		vertical_rotation_limit?: vec2f;
		continue_targeting?: boolean;
		tracking_radius?: number;
		offset?: vec2f;
		entity_offset?: vec3f;
		radius?: number;
		yaw_limit_min?: number;
		yaw_limit_max?: number;
		audio_listener?: number;
		player_effects?: boolean;
		aim_assist?: {
			preset_id?: string;
			target_mode?: "angle" | "distance";
			angle?: vec2f;
			distance?: number;
		};
		control_scheme?: "locked_player_relative_strafe" | "camera_relative" | "camera_relative_strafe" | "player_relative" | "player_relative_strafe";
	};
	/**
	 * CameraRotationOption represents a rotation keyframe option for spline instructions.
	 */
	export type CameraRotationOption = {
		/** Value is the rotation value for the keyframe. */
		value: vec3f;
		/** Time is the time of the keyframe within the spline. */
		time: number;
	};
	/**
	 * CameraSplineInstruction represents a camera spline instruction definition.
	 */
	export type CameraSplineInstruction = {
		/** TotalTime is the total time for the spline animation. */
		total_time: number;
		/** EaseType is the type of easing function applied to the spline. */
		ease_type: CameraSplineEaseType;
		/** Curve is the list of curve points defining the spline. */
		curve: vec3f[];
		/** ProgressKeyFrames is a list of key frames for the spline progress. */
		progress_key_frames: vec2f[];
		/** RotationOptions is a list of rotation keyframes for the spline. */
		rotation_options: CameraRotationOption[];
	};
	export type DisconnectFailReason = "unknown" | "cant_connect_no_internet" | "no_permissions" | "unrecoverable_error" | "third_party_blocked" | "third_party_no_internet" | "third_party_bad_ip" | "third_party_no_server_or_server_locked" | "version_mismatch" | "skin_issue" | "invite_session_not_found" | "edu_level_settings_missing" | "local_server_not_found" | "legacy_disconnect" | "user_leave_game_attempted" | "platform_locked_skins_error" | "realms_world_unassigned" | "realms_server_cant_connect" | "realms_server_hidden" | "realms_server_disabled_beta" | "realms_server_disabled" | "cross_platform_disallowed" | "cant_connect" | "session_not_found" | "client_settings_incompatible_with_server" | "server_full" | "invalid_platform_skin" | "edition_version_mismatch" | "edition_mismatch" | "level_newer_than_exe_version" | "no_fail_occurred" | "banned_skin" | "timeout" | "server_not_found" | "outdated_server" | "outdated_client" | "no_premium_platform" | "multiplayer_disabled" | "no_wifi" | "world_corruption" | "no_reason" | "disconnected" | "invalid_player" | "logged_in_other_location" | "server_id_conflict" | "not_allowed" | "not_authenticated" | "invalid_tenant" | "unknown_packet" | "unexpected_packet" | "invalid_command_request_packet" | "host_suspended" | "login_packet_no_request" | "login_packet_no_cert" | "missing_client" | "kicked" | "kicked_for_exploit" | "kicked_for_idle" | "resource_pack_problem" | "incompatible_pack" | "out_of_storage" | "invalid_level" | "disconnect_packet_deprecated" | "block_mismatch" | "invalid_heights" | "invalid_widths" | "connection_lost" | "zombie_connection" | "shutdown" | "reason_not_set" | "loading_state_timeout" | "resource_pack_loading_failed" | "searching_for_session_loading_screen_failed" | "conn_protocol_version" | "subsystem_status_error" | "empty_auth_from_discovery" | "empty_url_from_discovery" | "expired_auth_from_discovery" | "unknown_signal_service_sign_in_failure" | "xbl_join_lobby_failure" | "unspecified_client_instance_disconnection" | "conn_session_not_found" | "conn_create_peer_connection" | "conn_ice" | "conn_connect_request" | "conn_connect_response" | "conn_negotiation_timeout" | "conn_inactivity_timeout" | "stale_connection_being_replaced" | "realms_session_not_found" | "bad_packet" | "conn_failed_to_create_offer" | "conn_failed_to_create_answer" | "conn_failed_to_set_local_description" | "conn_failed_to_set_remote_description" | "conn_negotiation_timeout_waiting_for_response" | "conn_negotiation_timeout_waiting_for_accept" | "conn_incoming_connection_ignored" | "conn_signaling_parsing_failure" | "conn_signaling_unknown_error" | "conn_signaling_unicast_delivery_failed" | "conn_signaling_broadcast_delivery_failed" | "conn_signaling_generic_delivery_failed" | "editor_mismatch_editor_world" | "editor_mismatch_vanilla_world" | "world_transfer_not_primary_client" | "server_shutdown" | "game_setup_cancelled" | "game_setup_failed" | "no_venue" | "conn_signalling_sign_in_failed" | "session_access_denied" | "service_sign_in_issue" | "conn_no_signaling_channel" | "conn_not_logged_in" | "conn_client_signalling_error" | "sub_client_login_disabled" | "deep_link_trying_to_open_demo_world_while_signed_in" | "async_join_task_denied" | "realms_timeline_required" | "guest_withough_host" | "failed_to_join_experience";
	export type FullContainerName = {
		container_id: ContainerSlotType;
		dynamic_container_id?: number;
	};
	export type MovementEffectType = "GLIDE_BOOST" | "invalid";
	/**
	 * BiomeDefinition represents a biome definition in the game. This can be a vanilla biome or a completely
	 * custom biome.
	 */
	export type BiomeDefinition = {
		/** NameIndex represents the index of the biome name in the string list from BiomeDefinitionListPacket. */
		name_index: number;
		/** BiomeID is the biome ID. This is optional and can be empty. */
		biome_id: number;
		/** Temperature is the temperature of the biome, used for weather, biome behaviours and sky colour. */
		temperature: number;
		/** Downfall is the amount that precipitation affects colours and block changes. */
		downfall: number;
		/** Changes leaves turning white in snow */
		snow_foliage: number;
		/** Depth ... */
		depth: number;
		/** Scale ... */
		scale: number;
		/** MapWaterColour is an ARGB value for the water colour on maps in the biome. */
		map_water_colour: number;
		/** Rain is true if the biome has rain, false if it is a dry biome. */
		rain: boolean;
		tags?: number[];
		chunk_generation?: BiomeChunkGeneration;
	};
	/**
	 * BiomeChunkGeneration represents the information required for the client to generate chunks itself
	 * to create the illusion of a larger render distance.
	 */
	export type BiomeChunkGeneration = {
		climate?: BiomeClimate;
		consolidated_features?: BiomeConsolidatedFeature[];
		mountain_parameters?: BiomeMountainParameters;
		surface_material_adjustments?: BiomeElementData[];
		surface_materials?: BiomeSurfaceMaterial;
		/** HasDefaultOverworldSurface is true if the biome has a default overworld surface. */
		has_default_overworld_surface: boolean;
		/** HasSwampSurface is true if the biome has a swamp surface. */
		has_swamp_surface: boolean;
		/** HasFrozenOceanSurface is true if the biome has a frozen ocean surface. */
		has_frozen_ocean_surface: boolean;
		/** HasEndSurface is true if the biome has an end surface. */
		has_end_surface: boolean;
		mesa_surface?: BiomeMesaSurface;
		capped_surface?: BiomeCappedSurface;
		overworld_rules?: BiomeOverworldRules;
		multi_noise_rules?: BiomeMultiNoiseRules;
		legacy_rules?: BiomeConditionalTransformation[];
		replacements_data?: BiomeReplacementData[];
	};
	/**
	 * BiomeClimate represents the climate of a biome, mainly for ambience but also defines certain behaviours.
	 */
	export type BiomeClimate = {
		/** Temperature is the temperature of the biome, used for weather, biome behaviours and sky colour. */
		temperature: number;
		/** Downfall is the amount that precipitation affects colours and block changes. */
		downfall: number;
		/** SnowAccumulationMin is the minimum amount of snow that can accumulate in the biome, every 0.125 is another layer of snow. */
		snow_accumulation_min: number;
		/** SnowAccumulationMax is the maximum amount of snow that can accumulate in the biome, every 0.125 is another layer of snow. */
		snow_accumulation_max: number;
	};
	/**
	 * BiomeMountainParameters specifies the parameters for a mountain biome.
	 */
	export type BiomeMountainParameters = {
		/** SteepBlock is the runtime ID of the block to use for steep slopes. */
		steep_block: number;
		/** NorthSlopes is true if the biome has north slopes. */
		north_slopes: boolean;
		/** SouthSlopes is true if the biome has south slopes. */
		south_slopes: boolean;
		/** WestSlopes is true if the biome has west slopes. */
		west_slopes: boolean;
		/** EastSlopes is true if the biome has east slopes. */
		east_slopes: boolean;
		/** TopSlideEnabled is true if the biome has top slide enabled. */
		top_slide_enabled: boolean;
	};
	/**
	 * BiomeSurfaceMaterial specifies the materials to use for the surface layers of the biome.
	 */
	export type BiomeSurfaceMaterial = {
		/** TopBlock is the runtime ID of the block to use for the top layer. */
		top_block: number;
		/** MidBlock is the runtime ID to use for the middle layers. */
		mid_block: number;
		/** SeaFloorBlock is the runtime ID to use for the sea floor. */
		sea_floor_block: number;
		/** FoundationBlock is the runtime ID to use for the foundation layers. */
		foundation_block: number;
		/** SeaBlock is the runtime ID to use for the sea layers. */
		sea_block: number;
		/** SeaFloorDepth is the depth of the sea floor, in blocks. */
		sea_floor_depth: number;
	};
	/**
	 * BiomeMesaSurface specifies the materials to use for the mesa biome.
	 */
	export type BiomeMesaSurface = {
		/** ClayMaterial is the runtime ID of the block to use for clay layers. */
		clay_material: number;
		/** HardClayMaterial is the runtime ID of the block to use for hard clay layers. */
		hard_clay_material: number;
		/** BrycePillars is true if the biome has bryce pillars, which are tall spire-like structures. */
		bryce_pillars: boolean;
		/** HasForest is true if the biome has a forest. */
		has_forest: boolean;
	};
	/**
	 * BiomeCappedSurface specifies the materials to use for the capped surface of a biome, such as in the Nether.
	 */
	export type BiomeCappedSurface = {
		/** FloorBlocks is a list of runtime IDs to use for the floor blocks. */
		floor_blocks: number[];
		/** CeilingBlocks is a list of runtime IDs to use for the ceiling blocks. */
		ceiling_blocks: number[];
		sea_block?: number;
		foundation_block?: number;
		beach_block?: number;
	};
	/**
	 * BiomeMultiNoiseRules specifies the rules for multi-noise biomes, which are biomes that are defined by
	 * multiple noise parameters instead of just temperature and humidity.
	 */
	export type BiomeMultiNoiseRules = {
		/** Temperature is the temperature level of the biome. */
		temperature: number;
		/** Humidity is the humidity level of the biome. */
		humidity: number;
		/** Altitude is the altitude level of the biome. */
		altitude: number;
		/** Weirdness is the weirdness level of the biome. */
		weirdness: number;
		/** Weight is the weight of the biome, with a higher weight being more likely to be selected. */
		weight: number;
	};
	/**
	 * BiomeWeight defines the weight for a biome, used for weighted randomness.
	 */
	export type BiomeWeight = {
		/** Biome is the index of the biome name in the string list. */
		biome: number;
		/** Weight is the weight of the biome, with a higher weight being more likely to be selected. */
		weight: number;
	};
	/**
	 * BiomeTemperatureWeight defines the weight for a temperature, used for weighted randomness.
	 */
	export type BiomeTemperatureWeight = {
		/** Temperature is the temperature that can be selected. */
		temperature: number;
		/** Weight is the weight of the temperature, with a higher weight being more likely to be selected. */
		weight: number;
	};
	/**
	 * BiomeConsolidatedFeature represents a feature that is consolidated into a single feature for the biome.
	 */
	export type BiomeConsolidatedFeature = {
		/** Scatter defines how the feature is scattered in the biome. */
		scatter: BiomeScatterParameter;
		/** Feature is the index of the feature's name in the string list. */
		feature: number;
		/** Identifier is the index of the feature's identifier in the string list. */
		identifier: number;
		/** Pass is the index of the feature's pass in the string list. */
		pass: number;
		/** CanUseInternal is true if the feature can use internal features. */
		can_use_internal: boolean;
	};
	export type BiomeScatterParameter = {
		/** Coordinates is a list of coordinate rules to scatter the feature within. */
		coordinates: BiomeCoordinate[];
		/** EvaluationOrder is the order in which the coordinates are evaluated. */
		evaluation_order: "xyz" | "xzy" | "yxz" | "yzx" | "zxy" | "zyx";
		/** ChancePercentType is the type of expression operation to use for the chance percent. */
		chance_percent_type: number;
		/** ChancePercent is the index of the chance expression in the string list. */
		chance_percent: number;
		/** ChanceNumerator is the numerator of the chance expression. */
		chance_numerator: number;
		/** ChanceDenominator is the denominator of the chance expression. */
		chance_denominator: number;
		/** IterationsType is the type of expression operation to use for the iterations. */
		iterations_type: number;
		/** Iterations is the index of the iterations expression in the string list. */
		iterations: number;
	};
	/**
	 * BiomeCoordinate specifies coordinate rules for where features can be scattered in the biome.
	 */
	export type BiomeCoordinate = {
		/** MinValueType is the type of expression operation to use for the minimum value. */
		min_value_type: number;
		/** MinValue is the index of the minimum value expression in the string list. */
		min_value: number;
		/** MaxValueType is the type of expression operation to use for the maximum value. */
		max_value_type: number;
		/** MaxValue is the index of the maximum value expression in the string list. */
		max_value: number;
		/** GridOffset is the offset of the grid, used for fixed grid and jittered grid distributions. */
		grid_offset: number;
		/** GridStepSize is the step size of the grid, used for fixed grid and jittered grid distributions. */
		grid_step_size: number;
		/** Distribution is the type of distribution to use for the coordinate. */
		distribution: "single_valued" | "uniform" | "gaussian" | "inverse_gaussian" | "fixed_grid" | "jittered_grid" | "triangle";
	};
	/**
	 * BiomeElementData are set rules to adjust the surface materials of the biome.
	 */
	export type BiomeElementData = {
		/** NoiseFrequencyScale is the frequency scale of the noise used to adjust the surface materials. */
		noise_frequency_scale: number;
		/** NoiseLowerBound is the minimum noise value required to be selected. */
		noise_lower_bound: number;
		/** NoiseUpperBound is the maximum noise value required to be selected. */
		noise_upper_bound: number;
		/** HeightMinType is the type of expression operation to use for the minimum height. */
		height_min_type: number;
		/** HeightMin is the index of the minimum height expression in the string list. */
		height_min: number;
		/** HeightMaxType is the type of expression operation to use for the maximum height. */
		height_max_type: number;
		/** HeightMax is the index of the maximum height expression in the string list. */
		height_max: number;
		/** AdjustedMaterials is the materials to use for the surface layers of the biome if selected. */
		adjusted_materials: BiomeSurfaceMaterial;
	};
	/**
	 * BiomeOverworldRules specifies a list of transformation rules to apply to different parts of the overworld.
	 */
	export type BiomeOverworldRules = {
		/** HillsTransformations is a list of weighted biome transformations to apply to hills. */
		hills_transformations: BiomeWeight[];
		/** MutateTransformations is a list of weighted biome transformations to apply to mutated biomes. */
		mutate_transformations: BiomeWeight[];
		/** RiverTransformations is a list of weighted biome transformations to apply to rivers. */
		river_transformations: BiomeWeight[];
		/** ShoreTransformations is a list of weighted biome transformations to apply to shores. */
		shore_transformations: BiomeWeight[];
		/** PreHillsEdgeTransformations is a list of conditional transformations to apply to the edges of hills. */
		pre_hills_edge_transformations: BiomeConditionalTransformation[];
		/** PostShoreEdgeTransformations is a list of conditional transformations to apply to the edges of shores. */
		post_shore_edge_transformations: BiomeConditionalTransformation[];
		/** ClimateTransformations is a list of weighted temperature transformations to apply to the biome's climate. */
		climate_transformations: BiomeTemperatureWeight[];
	};
	/**
	 * BiomeConditionalTransformation is the legacy method of transforming biomes.
	 */
	export type BiomeConditionalTransformation = {
		/** WeightedBiomes is a list of biomes and their weights. */
		weighted_biomes: BiomeWeight[];
		/** ConditionJSON is an index of the condition JSON data in the string list. */
		condition_json: number;
		/** MinPassingNeighbours is the minimum number of neighbours that must pass the condition for the transformation to be applied. */
		min_passing_neighbours: number;
	};
	/**
	 * BiomeReplacementData represents data for biome replacements.
	 */
	export type BiomeReplacementData = {
		/** Biome is the biome ID to replace. */
		biome: number;
		/** Dimension is the dimension ID where the replacement applies. */
		dimension: number;
		/** TargetBiomes is a list of target biome IDs for the replacement. */
		target_biomes: number[];
		/** Amount is the amount of replacement to apply. */
		amount: number;
		/** NoiseFrequencyScale is the noise frequency scale to use for replacement selection. */
		noise_frequency_scale: number;
		/** ReplacementIndex is the index of the replacement. */
		replacement_index: number;
	};
	export type EaseType = "Linear" | "Spring" | "InQuad" | "OutQuad" | "InOutQuad" | "InCubic" | "OutCubic" | "InOutCubic" | "InQuart" | "OutQuart" | "InOutQuart" | "InQuint" | "OutQuint" | "InOutQuint" | "InSine" | "OutSine" | "InOutSine" | "InExpo" | "OutExpo" | "InOutExpo" | "InCirc" | "OutCirc" | "InOutCirc" | "InBounce" | "OutBounce" | "InOutBounce" | "InBack" | "OutBack" | "InOutBack" | "InElastic" | "OutElastic" | "InOutElastic";
	export type CameraSplineEaseType = "catmull_rom" | "linear";
	export type ParameterKeyframeValue = {
		/** Time is the time of the keyframe. */
		time: number;
		/** Value is the value at the keyframe. */
		value: vec3f;
	};
	export type GraphicsOverrideParameterType = "sky_zenith_color" | "sky_horizon_color" | "horizon_blend_min" | "horizon_blend_max" | "horizon_blend_start" | "horizon_blend_mie_start" | "rayleigh_strength" | "sun_mie_strength" | "moon_mie_strength" | "sun_glare_shape";
	export type DebugMarkerData = {
		text: string;
		position: vec3f;
		color: number;
		duration: bigint;
	};
	export type mcpe_packet = {
		name: "login" | "play_status" | "server_to_client_handshake" | "client_to_server_handshake" | "disconnect" | "resource_packs_info" | "resource_pack_stack" | "resource_pack_client_response" | "text" | "set_time" | "start_game" | "add_player" | "add_entity" | "remove_entity" | "add_item_entity" | "server_post_move" | "take_item_entity" | "move_entity" | "move_player" | "rider_jump" | "update_block" | "add_painting" | "tick_sync" | "level_sound_event_old" | "level_event" | "block_event" | "entity_event" | "mob_effect" | "update_attributes" | "inventory_transaction" | "mob_equipment" | "mob_armor_equipment" | "interact" | "block_pick_request" | "entity_pick_request" | "player_action" | "hurt_armor" | "set_entity_data" | "set_entity_motion" | "set_entity_link" | "set_health" | "set_spawn_position" | "animate" | "respawn" | "container_open" | "container_close" | "player_hotbar" | "inventory_content" | "inventory_slot" | "container_set_data" | "crafting_data" | "crafting_event" | "gui_data_pick_item" | "adventure_settings" | "block_entity_data" | "player_input" | "level_chunk" | "set_commands_enabled" | "set_difficulty" | "change_dimension" | "set_player_game_type" | "player_list" | "simple_event" | "event" | "spawn_experience_orb" | "clientbound_map_item_data" | "map_info_request" | "request_chunk_radius" | "chunk_radius_update" | "game_rules_changed" | "camera" | "boss_event" | "show_credits" | "available_commands" | "command_request" | "command_block_update" | "command_output" | "update_trade" | "update_equipment" | "resource_pack_data_info" | "resource_pack_chunk_data" | "resource_pack_chunk_request" | "transfer" | "play_sound" | "stop_sound" | "set_title" | "add_behavior_tree" | "structure_block_update" | "show_store_offer" | "purchase_receipt" | "player_skin" | "sub_client_login" | "initiate_web_socket_connection" | "set_last_hurt_by" | "book_edit" | "npc_request" | "photo_transfer" | "modal_form_request" | "modal_form_response" | "server_settings_request" | "server_settings_response" | "show_profile" | "set_default_game_type" | "remove_objective" | "set_display_objective" | "set_score" | "lab_table" | "update_block_synced" | "move_entity_delta" | "set_scoreboard_identity" | "set_local_player_as_initialized" | "update_soft_enum" | "network_stack_latency" | "script_custom_event" | "spawn_particle_effect" | "available_entity_identifiers" | "level_sound_event_v2" | "network_chunk_publisher_update" | "biome_definition_list" | "level_sound_event" | "level_event_generic" | "lectern_update" | "video_stream_connect" | "client_cache_status" | "on_screen_texture_animation" | "map_create_locked_copy" | "structure_template_data_export_request" | "structure_template_data_export_response" | "update_block_properties" | "client_cache_blob_status" | "client_cache_miss_response" | "education_settings" | "emote" | "multiplayer_settings" | "settings_command" | "anvil_damage" | "completed_using_item" | "network_settings" | "player_auth_input" | "creative_content" | "player_enchant_options" | "item_stack_request" | "item_stack_response" | "player_armor_damage" | "code_builder" | "update_player_game_type" | "emote_list" | "position_tracking_db_broadcast" | "position_tracking_db_request" | "debug_info" | "packet_violation_warning" | "motion_prediction_hints" | "animate_entity" | "camera_shake" | "player_fog" | "correct_player_move_prediction" | "item_registry" | "filter_text_packet" | "debug_renderer" | "sync_entity_property" | "add_volume_entity" | "remove_volume_entity" | "simulation_type" | "npc_dialogue" | "edu_uri_resource_packet" | "create_photo" | "update_subchunk_blocks" | "photo_info_request" | "subchunk" | "subchunk_request" | "client_start_item_cooldown" | "script_message" | "code_builder_source" | "ticking_areas_load_status" | "dimension_data" | "agent_action" | "change_mob_property" | "lesson_progress" | "request_ability" | "request_permissions" | "toast_request" | "update_abilities" | "update_adventure_settings" | "death_info" | "editor_network" | "feature_registry" | "server_stats" | "request_network_settings" | "game_test_request" | "game_test_results" | "update_client_input_locks" | "client_cheat_ability" | "camera_presets" | "unlocked_recipes" | "camera_instruction" | "compressed_biome_definitions" | "trim_data" | "open_sign" | "agent_animation" | "refresh_entitlements" | "toggle_crafter_slot_request" | "set_player_inventory_options" | "set_hud" | "award_achievement" | "clientbound_close_form" | "serverbound_loading_screen" | "jigsaw_structure_data" | "current_structure_feature" | "serverbound_diagnostics" | "camera_aim_assist" | "container_registry_cleanup" | "movement_effect" | "set_movement_authority" | "camera_aim_assist_presets" | "client_camera_aim_assist" | "client_movement_prediction_sync" | "update_client_options" | "player_video_capture" | "player_update_entity_overrides" | "player_location" | "clientbound_controls_scheme" | "server_script_debug_drawer" | "serverbound_pack_setting_change" | "clientbound_data_store" | "graphics_override_parameter" | "serverbound_data_store";
		params: packet_login | packet_play_status | packet_server_to_client_handshake | packet_client_to_server_handshake | packet_disconnect | packet_resource_packs_info | packet_resource_pack_stack | packet_resource_pack_client_response | packet_text | packet_set_time | packet_start_game | packet_add_player | packet_add_entity | packet_remove_entity | packet_add_item_entity | packet_take_item_entity | packet_move_entity | packet_move_player | packet_rider_jump | packet_update_block | packet_add_painting | packet_tick_sync | packet_level_sound_event_old | packet_level_event | packet_block_event | packet_entity_event | packet_mob_effect | packet_update_attributes | packet_inventory_transaction | packet_mob_equipment | packet_mob_armor_equipment | packet_interact | packet_block_pick_request | packet_entity_pick_request | packet_player_action | packet_hurt_armor | packet_set_entity_data | packet_set_entity_motion | packet_set_entity_link | packet_set_health | packet_set_spawn_position | packet_animate | packet_respawn | packet_container_open | packet_container_close | packet_player_hotbar | packet_inventory_content | packet_inventory_slot | packet_container_set_data | packet_crafting_data | packet_crafting_event | packet_gui_data_pick_item | packet_adventure_settings | packet_block_entity_data | packet_player_input | packet_level_chunk | packet_set_commands_enabled | packet_set_difficulty | packet_change_dimension | packet_set_player_game_type | packet_player_list | packet_simple_event | packet_event | packet_spawn_experience_orb | packet_clientbound_map_item_data | packet_map_info_request | packet_request_chunk_radius | packet_chunk_radius_update | packet_game_rules_changed | packet_camera | packet_boss_event | packet_show_credits | packet_available_commands | packet_command_request | packet_command_block_update | packet_command_output | packet_update_trade | packet_update_equipment | packet_resource_pack_data_info | packet_resource_pack_chunk_data | packet_resource_pack_chunk_request | packet_transfer | packet_play_sound | packet_stop_sound | packet_set_title | packet_add_behavior_tree | packet_structure_block_update | packet_show_store_offer | packet_purchase_receipt | packet_player_skin | packet_sub_client_login | packet_initiate_web_socket_connection | packet_set_last_hurt_by | packet_book_edit | packet_npc_request | packet_photo_transfer | packet_modal_form_request | packet_modal_form_response | packet_server_settings_request | packet_server_settings_response | packet_show_profile | packet_set_default_game_type | packet_remove_objective | packet_set_display_objective | packet_set_score | packet_lab_table | packet_update_block_synced | packet_move_entity_delta | packet_set_scoreboard_identity | packet_set_local_player_as_initialized | packet_update_soft_enum | packet_network_stack_latency | packet_script_custom_event | packet_spawn_particle_effect | packet_available_entity_identifiers | packet_level_sound_event_v2 | packet_network_chunk_publisher_update | packet_biome_definition_list | packet_level_sound_event | packet_level_event_generic | packet_lectern_update | packet_video_stream_connect | packet_client_cache_status | packet_on_screen_texture_animation | packet_map_create_locked_copy | packet_structure_template_data_export_request | packet_structure_template_data_export_response | packet_update_block_properties | packet_client_cache_blob_status | packet_client_cache_miss_response | packet_education_settings | packet_emote | packet_multiplayer_settings | packet_settings_command | packet_anvil_damage | packet_completed_using_item | packet_network_settings | packet_player_auth_input | packet_creative_content | packet_player_enchant_options | packet_item_stack_request | packet_item_stack_response | packet_player_armor_damage | packet_code_builder | packet_update_player_game_type | packet_emote_list | packet_position_tracking_db_request | packet_position_tracking_db_broadcast | packet_debug_info | packet_packet_violation_warning | packet_motion_prediction_hints | packet_animate_entity | packet_camera_shake | packet_player_fog | packet_correct_player_move_prediction | packet_item_registry | packet_filter_text_packet | packet_debug_renderer | packet_sync_entity_property | packet_add_volume_entity | packet_remove_volume_entity | packet_simulation_type | packet_npc_dialogue | packet_edu_uri_resource_packet | packet_create_photo | packet_update_subchunk_blocks | packet_photo_info_request | packet_subchunk | packet_subchunk_request | packet_client_start_item_cooldown | packet_script_message | packet_code_builder_source | packet_ticking_areas_load_status | packet_dimension_data | packet_agent_action | packet_change_mob_property | packet_lesson_progress | packet_request_ability | packet_request_permissions | packet_toast_request | packet_update_abilities | packet_update_adventure_settings | packet_death_info | packet_editor_network | packet_feature_registry | packet_server_stats | packet_request_network_settings | packet_game_test_request | packet_game_test_results | packet_update_client_input_locks | packet_client_cheat_ability | packet_camera_presets | packet_unlocked_recipes | packet_camera_instruction | packet_compressed_biome_definitions | packet_trim_data | packet_open_sign | packet_agent_animation | packet_refresh_entitlements | packet_toggle_crafter_slot_request | packet_set_player_inventory_options | packet_set_hud | packet_award_achievement | packet_server_post_move | packet_clientbound_close_form | packet_serverbound_loading_screen | packet_jigsaw_structure_data | packet_current_structure_feature | packet_serverbound_diagnostics | packet_camera_aim_assist | packet_container_registry_cleanup | packet_movement_effect | packet_set_movement_authority | packet_camera_aim_assist_presets | packet_client_camera_aim_assist | packet_client_movement_prediction_sync | packet_update_client_options | packet_player_video_capture | packet_player_update_entity_overrides | packet_player_location | packet_clientbound_controls_scheme | packet_server_script_debug_drawer | packet_serverbound_pack_setting_change | packet_clientbound_data_store | packet_graphics_override_parameter | packet_serverbound_data_store;
	};
	/**
	 * load the packet map file (auto-generated)
	 * # Login Sequence
	 * The login process is as follows:
	 * 
	 * * C→S: [Login](#packet_login)
	 * * S→C: [Server To Client Handshake](#packet_server_to_client_handshake)
	 * * C→S: [Client To Server Handshake](#packet_client_to_server_handshake)
	 * * S→C: [Play Status (Login success)](#packet_play_status)
	 * * To spawn, the following packets should be sent, in order, after the ones above:
	 * * S→C: [Resource Packs Info](#packet_resource_packs_info)
	 * * C→S: [Resource Pack Client Response](#packet_resource_pack_client_response)
	 * * S→C: [Resource Pack Stack](#packet_resource_pack_stack)
	 * * C→S: [Resource Pack Client Response](#packet_resource_pack_client_response)
	 * * S→C: [Start Game](#packet_start_game)
	 * * S→C: [Item Registry](#packet_item_registry)
	 * * S→C: [Creative Content](#packet_creative_content)
	 * * S→C: [Biome Definition List](#packet_biome_definition_list)
	 * * S→C: [Chunks](#packet_level_chunk)
	 * * S→C: [Play Status (Player spawn)](#packet_play_status)
	 * 
	 * If there are no resource packs being sent, a Resource Pack Stack can be sent directly
	 * after Resource Packs Info to avoid the client responses.
	 * 
	 * ===
	 */
	export type packet_login = {
		/** Protocol version (Big Endian!) */
		protocol_version: number;
		/** The structure of the login tokens has changed in 1.21.90. The encapsulated data is now a JSON object with a stringified `Certificate`. */
		tokens: LoginTokens;
	};
	export type LoginTokens = {
		/** JSON array of JWT data: contains the display name, UUID and XUID It should be signed by the Mojang public key For 1.21.90+, the 'identity' field is a Little-Endian length-prefixed JSON-encoded string. This JSON object must contain a 'Certificate' key, whose value is a *stringified* JSON object that holds the actual JWT 'chain' array. */
		identity: LittleString;
		/** JWT containing skin and other client data. */
		client: LittleString;
	};
	export type packet_play_status = {
		status: "login_success" | "failed_client" | "failed_spawn" | "player_spawn" | "failed_invalid_tenant" | "failed_vanilla_edu" | "failed_edu_vanilla" | "failed_server_full" | "failed_editor_vanilla_mismatch" | "failed_vanilla_editor_mismatch";
	};
	export type packet_server_to_client_handshake = {
		/** Contains the salt to complete the Diffie-Hellman key exchange */
		token: string;
	};
	/**
	 * Sent by the client in response to a Server To Client Handshake packet
	 * sent by the server. It is the first encrypted packet in the login handshake
	 * and serves as a confirmation that encryption is correctly initialized client side.
	 * It has no fields.
	 */
	export type packet_client_to_server_handshake = {
		
	};
	export type packet_disconnect = {
		reason: DisconnectFailReason;
		hide_disconnect_reason: boolean;
		message?: string;
		filtered_message?: string;
	};
	export type packet_resource_packs_info = {
		/** If the resource pack requires the client accept it. */
		must_accept: boolean;
		/** HasAddons specifies if any of the resource packs contain addons in them. If set to true, only clients that support addons will be able to download them. */
		has_addons: boolean;
		/** If scripting is enabled. */
		has_scripts: boolean;
		/** ForceDisableVibrantVisuals specifies if the vibrant visuals feature should be forcibly disabled on the server. If set to true, the server will ensure that vibrant visuals are not enabled, regardless of the client's settings. */
		disable_vibrant_visuals: boolean;
		world_template: {
			/** WorldTemplateUUID is teh UUID of the template that has been used to generate the world. Templates can be downloaded from the marketplace or installed via '.mctemplate' files. If the world was not generated from a template, this field is empty. */
			uuid: string;
			/** WorldTemplateVersion is the version of the world template that has been used to generate the world. If the world was not generated from a template, this field is empty. */
			version: string;
		};
		/** A list of resource packs that the client needs to download before joining the server. The order of these resource packs is not relevant in this packet. It is however important in the Resource Pack Stack packet. */
		texture_packs: TexturePackInfos;
	};
	export type packet_resource_pack_stack = {
		/** If the resource pack must be accepted for the player to join the server. */
		must_accept: boolean;
		/** [inline] */
		resource_packs: ResourcePackIdVersions;
		game_version: string;
		experiments: Experiments;
		experiments_previously_used: boolean;
		has_editor_packs: boolean;
	};
	export type packet_resource_pack_client_response = {
		response_status: "none" | "refused" | "send_packs" | "have_all_packs" | "completed";
		/** All of the pack IDs. */
		resourcepackids: ResourcePackIds;
	};
	/**
	 * Sent by the client to the server to send chat messages, and by the server to the client
	 * to forward or send messages, which may be chat, popups, tips etc.
	 * # https://github.com/pmmp/PocketMine-MP/blob/a43b46a93cb127f037c879b5d8c29cda251dd60c/src/pocketmine/network/mcpe/protocol/TextPacket.php
	 * # https://github.com/Sandertv/gophertunnel/blob/05ac3f843dd60d48b9ca0ab275cda8d9e85d8c43/minecraft/protocol/packet/text.go
	 */
	export type packet_text = {
		/** NeedsTranslation specifies if any of the messages need to be translated. */
		needs_translation: boolean;
		category: "message_only" | "authored" | "parameters";
		source_name?: string;
		message?: string;
		parameters?: string[];
		type: "raw" | "chat" | "translation" | "popup" | "jukebox_popup" | "tip" | "system" | "whisper" | "announcement" | "json_whisper" | "json" | "json_announcement";
		xuid: string;
		platform_chat_id: string;
		has_filtered_message: boolean;
		filtered_message?: string;
	};
	/**
	 * For additional information and examples of all the chat types above, see here: https://imgur.com/a/KhcFscg
	 * Sent by the server to update the current time client-side. The client actually advances time
	 * client-side by itself, so this packet does not need to be sent each tick. It is merely a means
	 * of synchronizing time between server and client.
	 */
	export type packet_set_time = {
		/** Time is the current time. The time is not limited to 24000 (time of day), but continues progressing after that. */
		time: number;
	};
	/**
	 * Sent by the server to send information about the world the player will be spawned in.
	 */
	export type packet_start_game = {
		/** The unique ID of the player. The unique ID is a value that remains consistent across different sessions of the same world, but most unofficial servers simply fill the runtime ID of the entity out for this field. */
		entity_id: bigint;
		/** The runtime ID of the player. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_entity_id: bigint;
		/** PlayerGameMode is the game mode the player currently has. It is a value from 0-4, with 0 being survival mode, 1 being creative mode, 2 being adventure mode, 3 being survival spectator and 4 being creative spectator. This field may be set to 5 to make the client fall back to the game mode set in the WorldGameMode field. */
		player_gamemode: GameMode;
		/** The spawn position of the player in the world. In servers this is often the same as the world's spawn position found below. */
		player_position: vec3f;
		/** The pitch and yaw of the player */
		rotation: vec2f;
		/** The seed used to generate the world. */
		seed: bigint;
		biome_type: number;
		biome_name: string;
		/** Dimension is the ID of the dimension that the player spawns in. It is a value from 0-2, with 0 being the overworld, 1 being the nether and 2 being the end. */
		dimension: "overworld" | "nether" | "end";
		/** Generator is the generator used for the world. It is a value from 0-4, with 0 being old limited worlds, 1 being infinite worlds, 2 being flat worlds, 3 being nether worlds and 4 being end worlds. A value of 0 will actually make the client stop rendering chunks you send beyond the world limit. As of 1.21.80, protocol.PlayerMovementModeServer is the minimum requirement for MovementType. */
		generator: number;
		/** The world game mode that a player gets when it first spawns in the world. It is shown in the settings and is used if the Player Gamemode is set to 5. */
		world_gamemode: GameMode;
		/** Specifies if the game is locked to "hardcore" mode or not, meaning the world will be unplayable after player dies in survival game mode. Persists even after switching player or world game modes. */
		hardcore: boolean;
		/** Difficulty is the difficulty of the world. It is a value from 0-3, with 0 being peaceful, 1 being easy, 2 being normal and 3 being hard. */
		difficulty: number;
		/** The block on which the world spawn of the world. This coordinate has no effect on the place that the client spawns, but it does have an effect on the direction that a compass poInts. */
		spawn_position: BlockCoordinates;
		/** Defines if achievements are disabled in the world. The client crashes if this value is set to true while the player's or the world's game mode is creative, and it's recommended to simply always set this to false as a server. */
		achievements_disabled: boolean;
		/** EditorWorldType is a value to dictate the type of editor mode, a special mode recently introduced adding "powerful tools for editing worlds, intended for experienced creators." */
		editor_world_type: "not_editor" | "project" | "test_level" | "realms_upload";
		/** Whether the world was created in editor mode */
		created_in_editor: boolean;
		/** Whether the world was exported from editor mode */
		exported_from_editor: boolean;
		/** The time at which the day cycle was locked if the day cycle is disabled using the respective game rule. The client will maIntain this time as Boolean as the day cycle is disabled. */
		day_cycle_stop_time: number;
		/** Some Minecraft: Education Edition field that specifies what 'region' the world was from, with 0 being None, 1 being RestOfWorld, and 2 being China. The actual use of this field is unknown. */
		edu_offer: number;
		/** Specifies if the world has education edition features enabled, such as the blocks or entities specific to education edition. */
		edu_features_enabled: boolean;
		edu_product_uuid: string;
		/** The level specifying the Intensity of the rain falling. When set to 0, no rain falls at all. */
		rain_level: number;
		lightning_level: number;
		/** The level specifying the Intensity of the thunder. This may actually be set independently from the rain level, meaning dark clouds can be produced without rain. */
		has_confirmed_platform_locked_content: boolean;
		/** Specifies if the world is a multi-player game. This should always be set to true for servers. */
		is_multiplayer: boolean;
		/** Specifies if LAN broadcast was Intended to be enabled for the world. */
		broadcast_to_lan: boolean;
		/** The mode used to broadcast the joined game across XBOX Live. */
		xbox_live_broadcast_mode: number;
		/** The mode used to broadcast the joined game across the platform. */
		platform_broadcast_mode: number;
		/** If commands are enabled for the player. It is recommended to always set this to true on the server, as setting it to false means the player cannot, under any circumstance, use a command. */
		enable_commands: boolean;
		/** Specifies if the texture pack the world might hold is required, meaning the client was forced to download it before joining. */
		is_texturepacks_required: boolean;
		/** Defines game rules currently active with their respective values. The value of these game rules may be either 'bool', 'Int32' or 'Float32'. Some game rules are server side only, and don't necessarily need to be sent to the client. */
		gamerules: GameRuleVarint[];
		experiments: Experiments;
		experiments_previously_used: boolean;
		/** Specifies if the world had the bonus map setting enabled when generating it. It does not have any effect client-side. */
		bonus_chest: boolean;
		/** Specifies if the world has the start with map setting enabled, meaning each joining player obtains a map. This should always be set to false, because the client obtains a map all on its own accord if this is set to true. */
		map_enabled: boolean;
		/** The permission level of the player. It is a value from 0-3, with 0 being visitor, 1 being member, 2 being operator and 3 being custom. */
		permission_level: PermissionLevel;
		/** The radius around the player in which chunks are ticked. Most servers set this value to a fixed number, as it does not necessarily affect anything client-side. */
		server_chunk_tick_range: number;
		/** Specifies if the texture pack of the world is locked, meaning it cannot be disabled from the world. This is typically set for worlds on the marketplace that have a dedicated texture pack. */
		has_locked_behavior_pack: boolean;
		/** Specifies if the texture pack of the world is locked, meaning it cannot be disabled from the world. This is typically set for worlds on the marketplace that have a dedicated texture pack. */
		has_locked_resource_pack: boolean;
		/** Specifies if the world from the server was from a locked world template. For servers this should always be set to false. */
		is_from_locked_world_template: boolean;
		msa_gamertags_only: boolean;
		/** Specifies if the world from the server was from a locked world template. For servers this should always be set to false. */
		is_from_world_template: boolean;
		/** Specifies if the world was a template that locks all settings that change properties above in the settings GUI. It is recommended to set this to true for servers that do not allow things such as setting game rules through the GUI. */
		is_world_template_option_locked: boolean;
		/** A hack that Mojang put in place to preserve backwards compatibility with old villagers. The his never actually read though, so it has no functionality. */
		only_spawn_v1_villagers: boolean;
		/** PersonaDisabled is true if persona skins are disabled for the current game session. */
		persona_disabled: boolean;
		/** CustomSkinsDisabled is true if custom skins are disabled for the current game session. */
		custom_skins_disabled: boolean;
		/** EmoteChatMuted specifies if players will be sent a chat message when using certain emotes. */
		emote_chat_muted: boolean;
		/** The version of the game from which Vanilla features will be used. The exact function of this field isn't clear. */
		game_version: string;
		limited_world_width: number;
		limited_world_length: number;
		is_new_nether: boolean;
		edu_resource_uri: EducationSharedResourceURI;
		experimental_gameplay_override: boolean;
		/** ChatRestrictionLevel specifies the level of restriction on in-game chat. */
		chat_restriction_level: "none" | "dropped" | "disabled";
		/** DisablePlayerInteractions is true if the client should ignore other players when interacting with the world. */
		disable_player_interactions: boolean;
		server_identifier: string;
		world_identifier: string;
		scenario_identifier: string;
		owner_identifier: string;
		/** A base64 encoded world ID that is used to identify the world. */
		level_id: string;
		/** The name of the world that the player is joining. Note that this field shows up above the player list for the rest of the game session, and cannot be changed. Setting the server name to this field is recommended. */
		world_name: string;
		/** A UUID specific to the premium world template that might have been used to generate the world. Servers should always fill out an empty String for this. */
		premium_world_template_id: string;
		/** Specifies if the world was a trial world, meaning features are limited and there is a time limit on the world. */
		is_trial: boolean;
		/** RewindHistorySize is the amount of history to keep at maximum */
		rewind_history_size: number;
		/** ServerAuthoritativeBlockBreaking specifies if block breaking should be sent through packet.PlayerAuthInput or not. This field is somewhat redundant as it is always enabled if server authoritative movement is enabled. */
		server_authoritative_block_breaking: boolean;
		current_tick: bigint;
		enchantment_seed: number;
		block_properties: BlockProperties;
		multiplayer_correlation_id: string;
		server_authoritative_inventory: boolean;
		engine: string;
		property_data: any;
		block_pallette_checksum: bigint;
		world_template_id: string;
		client_side_generation: boolean;
		block_network_ids_are_hashes: boolean;
		server_controlled_sound: boolean;
	};
	export type packet_add_player = {
		/** UUID is the UUID of the player. It is the same UUID that the client sent in the Login packet at the start of the session. A player with this UUID must exist in the player list (built up using the Player List packet) for it to show up in-game. */
		uuid: string;
		/** Username is the name of the player. This username is the username that will be set as the initial name tag of the player. */
		username: string;
		/** The runtime ID of the player. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_id: bigint;
		/** An identifier only set for particular platforms when chatting (presumably only for Nintendo Switch). It is otherwise an empty string, and is used to decide which players are able to chat with each other. */
		platform_chat_id: string;
		/** Position is the position to spawn the player on. If the player is on a distance that the viewer cannot see it, the player will still show up if the viewer moves closer. */
		position: vec3f;
		/** Velocity is the initial velocity the player spawns with. This velocity will initiate client side movement of the player. */
		velocity: vec3f;
		/** Pitch is the vertical rotation of the player. Facing straight forward yields a pitch of 0. Pitch is measured in degrees. */
		pitch: number;
		/** Yaw is the horizontal rotation of the player. Yaw is also measured in degrees. */
		yaw: number;
		/** HeadYaw is the same as Yaw, except that it applies specifically to the head of the player. A different value for HeadYaw than Yaw means that the player will have its head turned. */
		head_yaw: number;
		/** HeldItem is the item that the player is holding. The item is shown to the viewer as soon as the player itself shows up. Needless to say that this field is rather pointless, as additional packets still must be sent for armour to show up. */
		held_item: Item;
		/** GameType is the game type of the player. If set to GameTypeSpectator, the player will not be shown to viewers. */
		gamemode: GameMode;
		/** EntityMetadata is a map of entity metadata, which includes flags and data properties that alter in particular the way the player looks. Flags include ones such as 'on fire' and 'sprinting'. The metadata values are indexed by their property key. */
		metadata: MetadataDictionary;
		/** EntityProperties holds lists of entity properties that define specific attributes of an entity. As of v1.19.40, the vanilla server does not use these properties, however they are still supported by the protocol. */
		properties: EntityProperties;
		/** The unique ID of the player. The unique ID is a value that remains consistent across different sessions of the same world, but most unoffical servers simply fill the runtime ID of the player out for this field. */
		unique_id: bigint;
		permission_level: PermissionLevel;
		command_permission: CommandPermissionLevel;
		/** AbilityLayer represents the abilities of a specific layer, such as the base layer or the spectator layer. */
		abilities: AbilityLayers[];
		/** EntityLinks is a list of entity links that are currently active on the player. These links alter the way the player shows up when first spawned in terms of it shown as riding an entity. Setting these links is important for new viewers to see the player is riding another entity. */
		links: Links;
		/** DeviceID is the device ID set in one of the files found in the storage of the device of the player. It may be changed freely, so it should not be relied on for anything. */
		device_id: string;
		/** BuildPlatform is the build platform/device OS of the player that is about to be added, as it sent in the Login packet when joining. */
		device_os: DeviceOS;
	};
	export type packet_add_entity = {
		/** EntityUniqueID is the unique ID of the entity. The unique ID is a value that remains consistent across different sessions of the same world, but most servers simply fill the runtime ID of the entity out for */
		unique_id: bigint;
		/** EntityRuntimeID is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_id: bigint;
		/** EntityType is the string entity type of the entity, for example 'minecraft:skeleton'. A list of these entities may be found online. */
		entity_type: string;
		/** Position is the position to spawn the entity on. If the entity is on a distance that the player cannot see it, the entity will still show up if the player moves closer. */
		position: vec3f;
		/** Velocity is the initial velocity the entity spawns with. This velocity will initiate client side movement of the entity. */
		velocity: vec3f;
		/** Pitch is the vertical rotation of the entity. Facing straight forward yields a pitch of 0. Pitch is measured in degrees. */
		pitch: number;
		/** Yaw is the horizontal rotation of the entity. Yaw is also measured in degrees. */
		yaw: number;
		/** HeadYaw is the same as Yaw, except that it applies specifically to the head of the entity. A different value for HeadYaw than Yaw means that the entity will have its head turned. */
		head_yaw: number;
		/** BodyYaw is the same as Yaw, except that it applies specifically to the body of the entity. A different value for BodyYaw than HeadYaw means that the entity will have its body turned, although it is unclear what the difference between BodyYaw and Yaw is. */
		body_yaw: number;
		/** Attributes is a slice of attributes that the entity has. It includes attributes such as its health, movement speed, etc. */
		attributes: EntityAttributes;
		/** EntityMetadata is a map of entity metadata, which includes flags and data properties that alter in particular the way the entity looks. Flags include ones such as 'on fire' and 'sprinting'. The metadata values are indexed by their property key. */
		metadata: MetadataDictionary;
		/** EntityProperties holds lists of entity properties that define specific attributes of an entity. As of v1.19.40, the vanilla server does not use these properties, however they are still supported by the protocol. */
		properties: EntityProperties;
		/** EntityLinks is a list of entity links that are currently active on the entity. These links alter the way the entity shows up when first spawned in terms of it shown as riding an entity. Setting these links is important for new viewers to see the entity is riding another entity. */
		links: Links;
	};
	export type packet_remove_entity = {
		entity_id_self: bigint;
	};
	export type packet_add_item_entity = {
		entity_id_self: bigint;
		runtime_entity_id: bigint;
		item: Item;
		position: vec3f;
		velocity: vec3f;
		metadata: MetadataDictionary;
		is_from_fishing: boolean;
	};
	export type packet_take_item_entity = {
		runtime_entity_id: bigint;
		target: number;
	};
	/**
	 * MoveActorAbsolute is sent by the server to move an entity to an absolute position. It is typically used
	 * for movements where high accuracy isn't needed, such as for long range teleporting.
	 */
	export type packet_move_entity = {
		/** EntityRuntimeID is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_entity_id: bigint;
		/** Flags is a combination of flags that specify details of the movement. It is a combination of the flags above. */
		flags: number;
		/** Position is the position to spawn the entity on. If the entity is on a distance that the player cannot see it, the entity will still show up if the player moves closer. */
		position: vec3f;
		/** Rotation is a Vec3 holding the X, Y and Z rotation of the entity after the movement. This is a Vec3 for the reason that projectiles like arrows don't have yaw/pitch, but do have roll. */
		rotation: Rotation;
	};
	/**
	 * MovePlayer is sent by players to send their movement to the server, and by the server to update the
	 * movement of player entities to other players.
	 */
	export type packet_move_player = {
		/** EntityRuntimeID is the runtime ID of the player. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_id: number;
		/** Position is the position to spawn the player on. If the player is on a distance that the viewer cannot see it, the player will still show up if the viewer moves closer. */
		position: vec3f;
		/** Pitch is the vertical rotation of the player. Facing straight forward yields a pitch of 0. Pitch is measured in degrees. */
		pitch: number;
		/** Yaw is the horizontal rotation of the player. Yaw is also measured in degrees */
		yaw: number;
		/** HeadYaw is the same as Yaw, except that it applies specifically to the head of the player. A different value for HeadYaw than Yaw means that the player will have its head turned */
		head_yaw: number;
		/** Mode is the mode of the movement. It specifies the way the player's movement should be shown to other players. It is one of the constants below. */
		mode: "normal" | "reset" | "teleport" | "rotation";
		/** OnGround specifies if the player is considered on the ground. Note that proxies or hacked clients could fake this to always be true, so it should not be taken for granted. */
		on_ground: boolean;
		/** RiddenEntityRuntimeID is the runtime ID of the entity that the player might currently be riding. If not riding, this should be left 0. */
		ridden_runtime_id: number;
		teleport?: {
			cause: "unknown" | "projectile" | "chorus_fruit" | "command" | "behavior";
			source_entity_type: LegacyEntityType;
		};
		tick: bigint;
	};
	/**
	 * Removed in 1.21.80
	 */
	export type packet_rider_jump = {
		jump_strength: number;
	};
	/**
	 * UpdateBlock is sent by the server to update a block client-side, without resending the entire chunk that
	 * the block is located in. It is particularly useful for small modifications like block breaking/placing.
	 */
	export type packet_update_block = {
		/** Position is the block position at which a block is updated. */
		position: BlockCoordinates;
		/** NewBlockRuntimeID is the runtime ID of the block that is placed at Position after sending the packet to the client. */
		block_runtime_id: number;
		/** Flags is a combination of flags that specify the way the block is updated client-side. It is a combination of the flags above, but typically sending only the BlockUpdateNetwork flag is sufficient. */
		flags: UpdateBlockFlags;
		/** Layer is the world layer on which the block is updated. For most blocks, this is the first layer, as that layer is the default layer to place blocks on, but for blocks inside of each other, this differs. */
		layer: number;
	};
	export type UpdateBlockFlags = {
		neighbors?: boolean;
		network?: boolean;
		no_graphic?: boolean;
		unused?: boolean;
		priority?: boolean;
	};
	export type packet_add_painting = {
		entity_id_self: bigint;
		runtime_entity_id: bigint;
		coordinates: vec3f;
		direction: number;
		title: string;
	};
	/**
	 * TickSync is sent by the client and the server to maintain a synchronized, server-authoritative tick between
	 * the client and the server. The client sends this packet first, and the server should reply with another one
	 * of these packets, including the response time.
	 */
	export type packet_tick_sync = {
		/** ClientRequestTimestamp is the timestamp on which the client sent this packet to the server. The server should fill out that same value when replying. The ClientRequestTimestamp is always 0 */
		request_time: bigint;
		/** ServerReceptionTimestamp is the timestamp on which the server received the packet sent by the client. When the packet is sent by the client, this value is 0. ServerReceptionTimestamp is generally the current tick of the server. It isn't an actual timestamp, as the field implies */
		response_time: bigint;
	};
	export type packet_level_sound_event_old = {
		sound_id: number;
		position: vec3f;
		block_id: number;
		entity_type: number;
		is_baby_mob: boolean;
		is_global: boolean;
	};
	/**
	 * TODO: Check and verify old versions
	 */
	export type packet_level_event = {
		event: "sound_click" | "sound_click_fail" | "sound_shoot" | "sound_door" | "sound_fizz" | "sound_ignite" | "sound_ghast" | "sound_ghast_shoot" | "sound_blaze_shoot" | "sound_door_bump" | "sound_door_crash" | "sound_enderman_teleport" | "sound_anvil_break" | "sound_anvil_use" | "sound_anvil_fall" | "sound_pop" | "sound_portal" | "sound_itemframe_add_item" | "sound_itemframe_remove" | "sound_itemframe_place" | "sound_itemframe_remove_item" | "sound_itemframe_rotate_item" | "sound_camera" | "sound_orb" | "sound_totem" | "sound_armor_stand_break" | "sound_armor_stand_hit" | "sound_armor_stand_fall" | "sound_armor_stand_place" | "pointed_dripstone_land" | "dye_used" | "ink_sack_used" | "particle_shoot" | "particle_destroy" | "particle_splash" | "particle_eye_despawn" | "particle_spawn" | "particle_crop_growth" | "particle_guardian_curse" | "particle_death_smoke" | "particle_block_force_field" | "particle_projectile_hit" | "particle_dragon_egg_teleport" | "particle_crop_eaten" | "particle_critical" | "particle_enderman_teleport" | "particle_punch_block" | "particle_bubble" | "particle_evaporate" | "particle_destroy_armor_stand" | "particle_breaking_egg" | "particle_destroy_egg" | "particle_evaporate_water" | "particle_destroy_block_no_sound" | "particle_knockback_roar" | "particle_teleport_trail" | "particle_point_cloud" | "particle_explosion" | "particle_block_explosion" | "particle_vibration_signal" | "particle_dripstone_drip" | "particle_fizz_effect" | "particle_wax_on" | "particle_wax_off" | "particle_scrape" | "particle_electric_spark" | "particle_turtle_egg" | "particle_sculk_shriek" | "sculk_catalyst_bloom" | "sculk_charge" | "sculk_charge_pop" | "sonic_explosion" | "dust_plume" | "start_rain" | "start_thunder" | "stop_rain" | "stop_thunder" | "pause_game" | "pause_game_no_screen" | "set_game_speed" | "redstone_trigger" | "cauldron_explode" | "cauldron_dye_armor" | "cauldron_clean_armor" | "cauldron_fill_potion" | "cauldron_take_potion" | "cauldron_fill_water" | "cauldron_take_water" | "cauldron_add_dye" | "cauldron_clean_banner" | "block_start_break" | "block_stop_break" | "block_break_speed" | "particle_punch_block_down" | "particle_punch_block_up" | "particle_punch_block_north" | "particle_punch_block_south" | "particle_punch_block_west" | "particle_punch_block_east" | "particle_shoot_white_smoke" | "particle_breeze_wind_explosion" | "particle_trial_spawner_detection" | "particle_trial_spawner_spawning" | "particle_trial_spawner_ejecting" | "particle_wind_explosion" | "particle_wolf_armor_break" | "ominous_item_spawner" | "creaking_crumble" | "pale_oak_leaves" | "eyeblossom_open" | "eyeblossom_close" | "green_flame" | "set_data" | "players_sleeping" | "sleeping_players" | "jump_prevented" | "animation_vault_activate" | "animation_vault_deactivate" | "animation_vault_eject_item" | "animation_spawn_cobweb" | "add_particle_smash_attack_ground_dust" | "add_particle_creaking_heart_trail" | "add_particle_mask" | "add_particle_bubble" | "add_particle_bubble_manual" | "add_particle_critical" | "add_particle_block_force_field" | "add_particle_smoke" | "add_particle_explode" | "add_particle_evaporation" | "add_particle_flame" | "add_particle_candle_flame" | "add_particle_lava" | "add_particle_large_smoke" | "add_particle_redstone" | "add_particle_rising_red_dust" | "add_particle_item_break" | "add_particle_snowball_poof" | "add_particle_huge_explode" | "add_particle_huge_explode_seed" | "add_particle_mob_flame" | "add_particle_heart" | "add_particle_terrain" | "add_particle_town_aura" | "add_particle_portal" | "add_particle_water_splash" | "add_particle_water_splash_manual" | "add_particle_water_wake" | "add_particle_drip_water" | "add_particle_drip_lava" | "add_particle_drip_honey" | "add_particle_stalactite_drip_water" | "add_particle_stalactite_drip_lava" | "add_particle_falling_dust" | "add_particle_mob_spell" | "add_particle_mob_spell_ambient" | "add_particle_mob_spell_instantaneous" | "add_particle_ink" | "add_particle_slime" | "add_particle_rain_splash" | "add_particle_villager_angry" | "add_particle_villager_happy" | "add_particle_enchantment_table" | "add_particle_tracking_emitter" | "add_particle_note" | "add_particle_witch_spell" | "add_particle_carrot" | "add_particle_mob_appearance" | "add_particle_end_rod" | "add_particle_dragons_breath" | "add_particle_spit" | "add_particle_totem" | "add_particle_food" | "add_particle_fireworks_starter" | "add_particle_fireworks_spark" | "add_particle_fireworks_overlay" | "add_particle_balloon_gas" | "add_particle_colored_flame" | "add_particle_sparkler" | "add_particle_conduit" | "add_particle_bubble_column_up" | "add_particle_bubble_column_down" | "add_particle_sneeze" | "add_particle_shulker_bullet" | "add_particle_bleach" | "add_particle_dragon_destroy_block" | "add_particle_mycelium_dust" | "add_particle_falling_red_dust" | "add_particle_campfire_smoke" | "add_particle_tall_campfire_smoke" | "add_particle_dragon_breath_fire" | "add_particle_dragon_breath_trail" | "add_particle_blue_flame" | "add_particle_soul" | "add_particle_obsidian_tear" | "add_particle_portal_reverse" | "add_particle_snowflake" | "add_particle_vibration_signal" | "add_particle_sculk_sensor_redstone" | "add_particle_spore_blossom_shower" | "add_particle_spore_blossom_ambient" | "add_particle_wax" | "add_particle_electric_spark";
		position: vec3f;
		data: number;
	};
	export type packet_block_event = {
		/** Position is the position of the block that an event occurred at. */
		position: BlockCoordinates;
		/** EventType is the type of the block event. The event type decides the way the event data that follows is used */
		type: "sound" | "change_state";
		/** EventData holds event type specific data. For chests for example, opening the chest means the data must be 1 */
		data: number;
	};
	export type packet_entity_event = {
		runtime_entity_id: bigint;
		event_id: "jump" | "hurt_animation" | "death_animation" | "arm_swing" | "stop_attack" | "tame_fail" | "tame_success" | "shake_wet" | "use_item" | "eat_grass_animation" | "fish_hook_bubble" | "fish_hook_position" | "fish_hook_hook" | "fish_hook_tease" | "squid_ink_cloud" | "zombie_villager_cure" | "respawn" | "iron_golem_offer_flower" | "iron_golem_withdraw_flower" | "love_particles" | "villager_angry" | "villager_happy" | "witch_spell_particles" | "firework_particles" | "in_love_particles" | "silverfish_spawn_animation" | "guardian_attack" | "witch_drink_potion" | "witch_throw_potion" | "minecart_tnt_prime_fuse" | "creeper_prime_fuse" | "air_supply_expired" | "player_add_xp_levels" | "elder_guardian_curse" | "agent_arm_swing" | "ender_dragon_death" | "dust_particles" | "arrow_shake" | "eating_item" | "baby_animal_feed" | "death_smoke_cloud" | "complete_trade" | "remove_leash" | "caravan" | "consume_totem" | "player_check_treasure_hunter_achievement" | "entity_spawn" | "dragon_puke" | "item_entity_merge" | "start_swim" | "balloon_pop" | "treasure_hunt" | "agent_summon" | "charged_item" | "fall" | "grow_up" | "vibration_detected" | "drink_milk" | "wetness_stop";
		data: number;
	};
	export type packet_mob_effect = {
		runtime_entity_id: bigint;
		event_id: "add" | "update" | "remove";
		effect_id: number;
		amplifier: number;
		particles: boolean;
		duration: number;
		tick: bigint;
		ambient: boolean;
	};
	export type packet_update_attributes = {
		runtime_entity_id: bigint;
		attributes: PlayerAttributes;
		tick: bigint;
	};
	/**
	 * InventoryTransaction is a packet sent by the client. It essentially exists out of multiple sub-packets,
	 * each of which have something to do with the inventory in one way or another. Some of these sub-packets
	 * directly relate to the inventory, others relate to interaction with the world, that could potentially
	 * result in a change in the inventory.
	 */
	export type packet_inventory_transaction = {
		transaction: Transaction;
	};
	export type packet_mob_equipment = {
		runtime_entity_id: bigint;
		item: Item;
		slot: number;
		selected_slot: number;
		window_id: WindowID;
	};
	export type packet_mob_armor_equipment = {
		runtime_entity_id: bigint;
		helmet: Item;
		chestplate: Item;
		leggings: Item;
		boots: Item;
		body: Item;
	};
	/**
	 * Interact is sent by the client when it interacts with another entity in some way. It used to be used for
	 * normal entity and block interaction, but this is no longer the case now.
	 */
	export type packet_interact = {
		/** Action type is the ID of the action that was executed by the player. It is one of the constants that may be found above. */
		action_id: "leave_vehicle" | "mouse_over_entity" | "npc_open" | "open_inventory";
		/** TargetEntityRuntimeID is the runtime ID of the entity that the player interacted with. This is empty for the InteractActionOpenInventory action type. */
		target_entity_id: bigint;
		/** Position associated with the ActionType above. */
		has_position: boolean;
		position?: vec3f;
	};
	export type packet_block_pick_request = {
		x: number;
		y: number;
		z: number;
		add_user_data: boolean;
		selected_slot: number;
	};
	export type packet_entity_pick_request = {
		runtime_entity_id: bigint;
		selected_slot: number;
		/** WithData is true if the pick request requests the entity metadata. */
		with_data: boolean;
	};
	/**
	 * PlayerAction is sent by the client when it executes any action, for example starting to sprint, swim,
	 * starting the breaking of a block, dropping an item, etc.
	 */
	export type packet_player_action = {
		/** EntityRuntimeID is the runtime ID of the player. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_entity_id: bigint;
		/** ActionType is the ID of the action that was executed by the player. It is one of the constants that may be found above. */
		action: Action;
		/** BlockPosition is the position of the target block, if the action with the ActionType set concerned a block. If that is not the case, the block position will be zero. */
		position: BlockCoordinates;
		/** ResultPosition is the position of the action's result. When a UseItemOn action is sent, this is the position of the block clicked, but when a block is placed, this is the position at which the block will be placed. */
		result_position: BlockCoordinates;
		/** BlockFace is the face of the target block that was touched. If the action with the ActionType set concerned a block. If not, the face is always 0. */
		face: number;
	};
	export type packet_hurt_armor = {
		cause: number;
		damage: number;
		armor_slots: bigint;
	};
	export type packet_set_entity_data = {
		runtime_entity_id: bigint;
		metadata: MetadataDictionary;
		/** EntityProperties holds lists of entity properties that define specific attributes of an entity. As of v1.19.40, the vanilla server does not use these properties, however they are still supported by the protocol. */
		properties: EntityProperties;
		tick: bigint;
	};
	/**
	 * SetActorMotion is sent by the server to change the client-side velocity of an entity. It is usually used
	 * in combination with server-side movement calculation.
	 */
	export type packet_set_entity_motion = {
		/** EntityRuntimeID is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_entity_id: bigint;
		/** Velocity is the new velocity the entity gets. This velocity will initiate the client-side movement of the entity. */
		velocity: vec3f;
		tick: bigint;
	};
	/**
	 * SetActorLink is sent by the server to initiate an entity link client-side, meaning one entity will start
	 * riding another.
	 */
	export type packet_set_entity_link = {
		link: Link;
	};
	export type packet_set_health = {
		health: number;
	};
	export type packet_set_spawn_position = {
		spawn_type: "player" | "world";
		player_position: BlockCoordinates;
		dimension: number;
		world_position: BlockCoordinates;
	};
	export type packet_animate = {
		action_id: "none" | "swing_arm" | "unknown" | "wake_up" | "critical_hit" | "magic_critical_hit";
		runtime_entity_id: bigint;
		/** Data holds an action-specific value whose meaning depends on the animation type. */
		data: number;
		has_swing_source: boolean;
		swing_source?: string;
	};
	export type packet_respawn = {
		position: vec3f;
		state: number;
		runtime_entity_id: bigint;
	};
	/**
	 * ContainerOpen is sent by the server to open a container client-side. This container must be physically
	 * present in the world, for the packet to have any effect. Unlike Java Edition, Bedrock Edition requires that
	 * chests for example must be present and in range to open its inventory.
	 */
	export type packet_container_open = {
		/** WindowID is the ID representing the window that is being opened. It may be used later to close the container using a ContainerClose packet. */
		window_id: WindowID;
		/** ContainerType is the type ID of the container that is being opened when opening the container at the position of the packet. It depends on the block/entity, and could, for example, be the window type of a chest or a hopper, but also a horse inventory. */
		window_type: WindowType;
		/** ContainerPosition is the position of the container opened. The position must point to a block entity that actually has a container. If that is not the case, the window will not be opened and the packet will be ignored, if a valid ContainerEntityUniqueID has not also been provided. */
		coordinates: BlockCoordinates;
		/** ContainerEntityUniqueID is the unique ID of the entity container that was opened. It is only used if the ContainerType is one that points to an entity, for example a horse. */
		runtime_entity_id: bigint;
	};
	/**
	 * ContainerClose is sent by the server to close a container the player currently has opened, which was opened
	 * using the ContainerOpen packet, or by the client to tell the server it closed a particular container, such
	 * as the crafting grid.
	 */
	export type packet_container_close = {
		/** WindowID is the ID representing the window of the container that should be closed. It must be equal to the one sent in the ContainerOpen packet to close the designated window. */
		window_id: WindowID;
		/** ContainerType is the type ID of the container that is being opened when opening the container at the position of the packet. It depends on the block/entity, and could, for example, be the window type of a chest or a hopper, but also a horse inventory. */
		window_type: WindowType;
		/** ServerSide determines whether or not the container was force-closed by the server. If this value is not set correctly, the client may ignore the packet and respond with a PacketViolationWarning. */
		server: boolean;
	};
	/**
	 * PlayerHotBar is sent by the server to the client. It used to be used to link hot bar slots of the player to
	 * actual slots in the inventory, but as of 1.2, this was changed and hot bar slots are no longer a free
	 * floating part of the inventory.
	 * Since 1.2, the packet has been re-purposed, but its new functionality is not clear.
	 */
	export type packet_player_hotbar = {
		selected_slot: number;
		window_id: WindowID;
		select_slot: boolean;
	};
	/**
	 * InventoryContent is sent by the server to update the full content of a particular inventory. It is usually
	 * sent for the main inventory of the player, but also works for other inventories that are currently opened
	 * by the player.
	 */
	export type packet_inventory_content = {
		/** WindowID is the ID that identifies one of the windows that the client currently has opened, or one of the consistent windows such as the main inventory. */
		window_id: WindowIDVarint;
		/** Content is the new content of the inventory. The length of this slice must be equal to the full size of the inventory window updated. */
		input: ItemStacks;
		/** Container is the protocol.FullContainerName that describes the container that the content is for. */
		container: FullContainerName;
		/** storage_item is the item that is acting as the storage container for the inventory. If the inventory is not a dynamic container then this field should be left empty. When set, only the item type is used by the client and none of the other stack info. */
		storage_item: Item;
	};
	/**
	 * InventorySlot is sent by the server to update a single slot in one of the inventory windows that the client
	 * currently has opened. Usually this is the main inventory, but it may also be the off hand or, for example,
	 * a chest inventory.
	 */
	export type packet_inventory_slot = {
		/** WindowID is the ID of the window that the packet modifies. It must point to one of the windows that the client currently has opened. */
		window_id: WindowIDVarint;
		/** Slot is the index of the slot that the packet modifies. The new item will be set to the slot at this index. */
		slot: number;
		/** Container is the protocol.FullContainerName that describes the container that the content is for. */
		container: FullContainerName;
		/** storage_item is the item that is acting as the storage container for the inventory. If the inventory is not a dynamic container then this field should be left empty. When set, only the item type is used by the client and none of the other stack info. */
		storage_item: Item;
		/** NewItem is the item to be put in the slot at Slot. It will overwrite any item that may currently be present in that slot. */
		item: Item;
	};
	/**
	 * ContainerSetData is sent by the server to update specific data of a single container, meaning a block such
	 * as a furnace or a brewing stand. This data is usually used by the client to display certain features
	 * client-side.
	 */
	export type packet_container_set_data = {
		/** WindowID is the ID of the window that should have its data set. The player must have a window open with the window ID passed, or nothing will happen. */
		window_id: WindowID;
		/** Key is the key of the property. It is one of the constants that can be found above. Multiple properties share the same key, but the functionality depends on the type of the container that the data is set to. IF FURNACE: 0: furnace_tick_count 1: furnace_lit_time 2: furnace_lit_duration 3: furnace_stored_xp 4: furnace_fuel_aux IF BREWING STAND: 0: brew_time 1: brew_fuel_amount 2: brew_fuel_total */
		property: number;
		/** Value is the value of the property. Its use differs per property. */
		value: number;
	};
	export type packet_crafting_data = {
		recipes: Recipes;
		/** PotionContainerChangeRecipes is a list of all recipes to convert a potion from one type to another, such as from a drinkable potion to a splash potion, or from a splash potion to a lingering potion. */
		potion_type_recipes: PotionTypeRecipes;
		potion_container_recipes: PotionContainerChangeRecipes;
		/** MaterialReducers is a list of all material reducers which is used in education edition chemistry. */
		material_reducers: MaterialReducer[];
		/** ClearRecipes indicates if all recipes currently active on the client should be cleaned. Doing this means that the client will have no recipes active by itself: Any CraftingData packets previously sent will also be discarded, and only the recipes in this CraftingData packet will be used. */
		clear_recipes: boolean;
	};
	/**
	 * CraftingEvent is sent by the client when it crafts a particular item. Note that this packet may be fully
	 * ignored, as the InventoryTransaction packet provides all the information required.
	 */
	export type packet_crafting_event = {
		/** WindowID is the ID representing the window that the player crafted in. */
		window_id: WindowID;
		/** CraftingType is a type that indicates the way the crafting was done, for example if a crafting table was used. */
		recipe_type: "inventory" | "crafting" | "workbench";
		/** RecipeUUID is the UUID of the recipe that was crafted. It points to the UUID of the recipe that was sent earlier in the CraftingData packet. */
		recipe_id: string;
		/** Input is a list of items that the player put into the recipe so that it could create the Output items. These items are consumed in the process. */
		input: Item[];
		/** Output is a list of items that were obtained as a result of crafting the recipe. */
		result: Item[];
	};
	/**
	 * GUIDataPickItem is sent by the server to make the client 'select' a hot bar slot. It currently appears to
	 * be broken however, and does not actually set the selected slot to the hot bar slot set in the packet.
	 */
	export type packet_gui_data_pick_item = {
		/** ItemName is the name of the item that shows up in the top part of the popup that shows up when selecting an item. It is shown as if an item was selected by the player itself. */
		item_name: string;
		/** ItemEffects is the line under the ItemName, where the effects of the item are usually situated. */
		item_effects: string;
		/** HotBarSlot is the hot bar slot to be selected/picked. This does not currently work, so it does not matter what number this is. */
		hotbar_slot: number;
	};
	/**
	 * AdventureSettings is sent by the server to update game-play related features, in particular permissions to
	 * access these features for the client. It includes allowing the player to fly, build and mine, and attack
	 * entities. Most of these flags should be checked server-side instead of using this packet only.
	 * The client may also send this packet to the server when it updates one of these settings through the
	 * in-game settings interface. The server should verify if the player actually has permission to update those
	 * settings.
	 */
	export type packet_adventure_settings = {
		/** Flags is a set of flags that specify certain properties of the player, such as whether or not it can fly and/or move through blocks. It is one of the AdventureFlag constants above. */
		flags: AdventureFlags;
		/** CommandPermissionLevel is a permission level that specifies the kind of commands that the player is allowed to use. */
		command_permission: CommandPermissionLevelVarint;
		/** ActionPermissions is, much like Flags, a set of flags that specify actions that the player is allowed to undertake, such as whether it is allowed to edit blocks, open doors etc. It is a combination of the ActionPermission constants above. */
		action_permissions: ActionPermissions;
		/** PermissionLevel is the permission level of the player as it shows up in the player list built up using the PlayerList packet. It is one of the PermissionLevel constants above. */
		permission_level: PermissionLevel;
		/** Custom permissions */
		custom_stored_permissions: number;
		/** PlayerUniqueID is a unique identifier of the player. It appears it is not required to fill this field out with a correct value. Simply writing 0 seems to work. */
		user_id: bigint;
	};
	export type AdventureFlags = {
		world_immutable?: boolean;
		no_pvp?: boolean;
		auto_jump?: boolean;
		allow_flight?: boolean;
		no_clip?: boolean;
		world_builder?: boolean;
		flying?: boolean;
		muted?: boolean;
	};
	export type ActionPermissions = {
		mine?: boolean;
		doors_and_switches?: boolean;
		open_containers?: boolean;
		attack_players?: boolean;
		attack_mobs?: boolean;
		operator?: boolean;
		teleport?: boolean;
		build?: boolean;
		default?: boolean;
	};
	export type packet_block_entity_data = {
		position: BlockCoordinates;
		nbt: any;
	};
	/**
	 * Removed in 1.21.80
	 */
	export type packet_player_input = {
		motion_x: number;
		motion_z: number;
		jumping: boolean;
		sneaking: boolean;
	};
	/**
	 * LevelChunk is sent by the server to provide the client with a chunk of a world data (16xYx16 blocks).
	 * Typically a certain amount of chunks is sent to the client before sending it the spawn PlayStatus packet,
	 * so that the client spawns in a loaded world.
	 */
	export type packet_level_chunk = {
		/** ChunkX is the X coordinate of the chunk sent. (To translate a block's X to a chunk's X: x >> 4) */
		x: number;
		/** ChunkZ is the Z coordinate of the chunk sent. (To translate a block's Z to a chunk's Z: z >> 4) */
		z: number;
		dimension: number;
		/** SubChunkCount is the amount of sub chunks that are part of the chunk sent. Depending on if the cache is enabled, a list of blob hashes will be sent, or, if disabled, the sub chunk data. On newer versions, if this is a negative value it indicates to use the Subchunk Polling mechanism */
		sub_chunk_count: number;
		/** HighestSubChunk is the highest sub-chunk at the position that is not all air. It is only set if the RequestMode is set to protocol.SubChunkRequestModeLimited. */
		highest_subchunk_count?: number;
		/** CacheEnabled specifies if the client blob cache should be enabled. This system is based on hashes of blobs which are consistent and saved by the client in combination with that blob, so that the server does not have to send the same chunk multiple times. If the client does not yet have a blob with the hash sent, it will send a ClientCacheBlobStatus packet containing the hashes is does not have the data of. */
		cache_enabled: boolean;
		blobs?: {
			hashes: bigint[];
		};
		payload: ByteArray;
	};
	export type packet_set_commands_enabled = {
		enabled: boolean;
	};
	export type packet_set_difficulty = {
		difficulty: number;
	};
	export type packet_change_dimension = {
		dimension: number;
		position: vec3f;
		respawn: boolean;
		loading_screen_id?: number;
	};
	/**
	 * SetPlayerGameType is sent by the server to update the game type (game mode) of the player
	 */
	export type packet_set_player_game_type = {
		/** The new gamemode for the player. Some of these game types require additional flags to be set in an AdventureSettings packet for the game mode to obtain its full functionality. # Note: this is actually encoded 64-bit varint, but realistically won't exceed a few bits */
		gamemode: GameMode;
	};
	export type packet_player_list = {
		records: PlayerRecords;
	};
	export type packet_simple_event = {
		event_type: "uninitialized_subtype" | "enable_commands" | "disable_commands" | "unlock_world_template_settings";
	};
	/**
	 * Event is sent by the server to send an event with additional data. It is typically sent to the client for
	 * telemetry reasons, much like the SimpleEvent packet.
	 */
	export type packet_event = {
		runtime_id: bigint;
		event_type: "achievement_awarded" | "entity_interact" | "portal_built" | "portal_used" | "mob_killed" | "cauldron_used" | "player_death" | "boss_killed" | "agent_command" | "agent_created" | "banner_pattern_removed" | "command_executed" | "fish_bucketed" | "mob_born" | "pet_died" | "cauldron_block_used" | "composter_block_used" | "bell_block_used" | "actor_definition" | "raid_update" | "player_movement_anomaly" | "player_movement_corrected" | "honey_harvested" | "target_block_hit" | "piglin_barter" | "waxed_or_unwaxed_copper" | "code_builder_runtime_action" | "code_builder_scoreboard" | "strider_ridden_in_lava_in_overworld" | "sneak_close_to_sculk_sensor" | "careful_restoration" | "item_used";
		use_player_id: number;
		event_data: Buffer;
	};
	export type packet_spawn_experience_orb = {
		position: vec3f;
		count: number;
	};
	export type UpdateMapFlags = {
		void?: boolean;
		texture?: boolean;
		decoration?: boolean;
		initialisation?: boolean;
	};
	/**
	 * ClientBoundMapItemData is sent by the server to the client to update the data of a map shown to the client.
	 * It is sent with a combination of flags that specify what data is updated.
	 * The ClientBoundMapItemData packet may be used to update specific parts of the map only. It is not required
	 * to send the entire map each time when updating one part.
	 */
	export type packet_clientbound_map_item_data = {
		/** MapID is the unique identifier that represents the map that is updated over network. It remains consistent across sessions. */
		map_id: bigint;
		/** UpdateFlags is a combination of flags found above that indicate what parts of the map should be updated client-side. */
		update_flags: UpdateMapFlags;
		/** Dimension is the dimension of the map that should be updated, for example the overworld (0), the nether (1) or the end (2). */
		dimension: number;
		/** LockedMap specifies if the map that was updated was a locked map, which may be done using a cartography table. */
		locked: boolean;
		/** Origin is the center position of the map being updated. */
		origin: vec3i;
		/** The following fields apply only for the MapUpdateFlagInitialisation. MapsIncludedIn holds an array of map IDs that the map updated is included in. This has to do with the scale of the map: Each map holds its own map ID and all map IDs of maps that include this map and have a bigger scale. This means that a scale 0 map will have 5 map IDs in this slice, whereas a scale 4 map will have only 1 (its own). The actual use of this field remains unknown. */
		included_in?: bigint[];
		/** Scale is the scale of the map as it is shown in-game. It is written when any of the MapUpdateFlags are set to the UpdateFlags field. */
		scale?: number;
		/** The following fields apply only for the MapUpdateFlagDecoration. TrackedObjects is a list of tracked objects on the map, which may either be entities or blocks. The client makes sure these tracked objects are actually tracked. (position updated etc.) */
		tracked?: {
			objects: TrackedObject[];
			decorations: MapDecoration[];
		};
		texture?: {
			width: number;
			height: number;
			x_offset: number;
			y_offset: number;
			pixels: number[];
		};
	};
	export type packet_map_info_request = {
		map_id: bigint;
		/** ClientPixels is a map of pixels sent from the client to notify the server about the pixels that it isn't aware of. */
		client_pixels: {
			rgba: number;
			index: number;
		}[];
	};
	/**
	 * RequestChunkRadius is sent by the client to the server to update the server on the chunk view radius that
	 * it has set in the settings. The server may respond with a ChunkRadiusUpdated packet with either the chunk
	 * radius requested, or a different chunk radius if the server chooses so.
	 */
	export type packet_request_chunk_radius = {
		/** ChunkRadius is the requested chunk radius. This value is always the value set in the settings of the player. */
		chunk_radius: number;
		max_radius: number;
	};
	/**
	 * ChunkRadiusUpdated is sent by the server in response to a RequestChunkRadius packet. It defines the chunk
	 * radius that the server allows the client to have. This may be lower than the chunk radius requested by the
	 * client in the RequestChunkRadius packet.
	 */
	export type packet_chunk_radius_update = {
		/** ChunkRadius is the final chunk radius that the client will adapt when it receives the packet. It does not have to be the same as the requested chunk radius. */
		chunk_radius: number;
	};
	export type packet_game_rules_changed = {
		rules: GameRuleI32[];
	};
	/**
	 * Camera is sent by the server to use an Education Edition camera on a player. It produces an image
	 * client-side.
	 */
	export type packet_camera = {
		/** CameraEntityUniqueID is the unique ID of the camera entity from which the picture was taken. */
		camera_entity_unique_id: bigint;
		/** TargetPlayerUniqueID is the unique ID of the target player. The unique ID is a value that remains consistent across different sessions of the same world, but most servers simply fill the runtime ID of the player out for this field. */
		target_player_unique_id: bigint;
	};
	export type packet_boss_event = {
		boss_entity_id: bigint;
		type: "show_bar" | "register_player" | "hide_bar" | "unregister_player" | "set_bar_progress" | "set_bar_title" | "update_properties" | "texture" | "query";
		title?: string;
		filtered_title?: string;
		progress?: number;
		screen_darkening?: number;
		color?: number;
		overlay?: number;
		player_id?: bigint;
	};
	export type packet_show_credits = {
		runtime_entity_id: bigint;
		status: number;
	};
	/**
	 * This packet sends a list of commands to the client. Commands can have
	 * arguments, and some of those arguments can have 'enum' values, which are a list of possible
	 * values for the argument. The serialization is rather complex and involves palettes like chunks.
	 * # In bedrock-protocol, listen to on('client.commands') for a simpler representation
	 */
	export type packet_available_commands = {
		/** The length of the enums for all the command parameters in this packet */
		values_len: number;
		/** Here all the enum values for all of the possible commands are stored to one array palette */
		enum_values: string[];
		/** chained_subcommand_values is a slice of all chained subcommand names. chained_subcommand_values generally should contain each possible value only once. chained_subcommands are built by pointing to entries in this slice. */
		chained_subcommand_values: string[];
		/** Integer parameters may sometimes have a prefix, such as the XP command: /xp <amount: int> [player: target] <- here, the xp command gives experience points /xp <amount: int>L [player: target] <- here, the xp command gives experience levels This is the palette of suffixes */
		suffixes: string[];
		/** The list of enum objects */
		enums: {
			/** The name of the enum */
			name: string;
			/** The values in the enum. In 1.21.130 this is always lu32. */
			values: number[];
		}[];
		/** chained_subcommands is a slice of all subcommands that are followed by a chained command. An example usage of this is /execute which allows you to run another command as another entity or at a different position etc. */
		chained_subcommands: {
			/** ChainedSubcommandValue represents the value for a chained subcommand argument. name is the name of the chained subcommand and shows up in the list as a regular subcommand enum. */
			name: string;
			/** values contains the index and parameter type of the chained subcommand. */
			values: {
				/** index is the index of the argument in the ChainedSubcommandValues slice. In 1.21.130 this changed from lu16 to varint. */
				index: number;
				/** value is a combination of the flags above. In 1.21.130 this changed from lu16 to varint. */
				value: number;
			}[];
		}[];
		command_data: {
			name: string;
			description: string;
			flags: number;
			permission_level: string;
			alias: number;
			chained_subcommand_offsets: number[];
			overloads: {
				chaining: boolean;
				parameters: {
					parameter_name: string;
					value_type: "int" | "float" | "value" | "wildcard_int" | "operator" | "command_operator" | "target" | "wildcard_target" | "file_path" | "integer_range" | "equipment_slots" | "string" | "block_position" | "position" | "message" | "raw_text" | "json" | "block_states" | "command";
					enum_type: "valid" | "enum" | "suffixed" | "soft_enum";
					optional: boolean;
					options: CommandFlags;
				}[];
			}[];
		}[];
		dynamic_enums: {
			name: string;
			values: string[];
		}[];
		enum_constraints: {
			value_index: number;
			enum_index: number;
			constraints: {
				constraint: "cheats_enabled" | "operator_permissions" | "host_permissions";
			}[];
		}[];
	};
	/**
	 * ParamOptionCollapseEnum specifies if the enum (only if the Type is actually an enum type. If not,
	 * setting this to true has no effect) should be collapsed. This means that the options of the enum are
	 * never shown in the actual usage of the command, but only as auto-completion, like it automatically does
	 * with enums that have a big amount of options. To illustrate, it can make
	 * <false|true|yes|no> <$Name: bool>.
	 */
	export type CommandFlags = {
		unused?: boolean;
		collapse_enum?: boolean;
		has_semantic_constraint?: boolean;
		as_chained_command?: boolean;
		unknown2?: boolean;
	};
	/**
	 * enum_size_based_on_values_len: native
	 * CommandRequest is sent by the client to request the execution of a server-side command. Although some
	 * servers support sending commands using the Text packet, this packet is guaranteed to have the correct
	 * result.
	 */
	export type packet_command_request = {
		/** CommandLine is the raw entered command line. The client does no parsing of the command line by itself (unlike it did in the early stages), but lets the server do that. */
		command: string;
		/** Origin holds information about the command sender that will be returnd back in the command response */
		origin: CommandOrigin;
		/** Internal specifies if the command request internal. Setting it to false seems to work and the usage of this field is not known. */
		internal: boolean;
		/** Specifies the version of the command to run, relative to the current Minecraft version. Should be set to 52 as of 1.19.62 */
		version: string;
	};
	/**
	 * CommandBlockUpdate is sent by the client to update a command block at a specific position. The command
	 * block may be either a physical block or an entity.
	 */
	export type packet_command_block_update = {
		/** Block specifies if the command block updated was an actual physical block. If false, the command block is in a minecart and has an entity runtime ID instead. */
		is_block: boolean;
		position?: BlockCoordinates;
		mode?: "impulse" | "repeat" | "chain";
		needs_redstone?: boolean;
		conditional?: boolean;
		minecart_entity_runtime_id?: bigint;
		command: string;
		last_output: string;
		name: string;
		filtered_name: string;
		should_track_output: boolean;
		tick_delay: number;
		execute_on_first_tick: boolean;
	};
	export type packet_command_output = {
		/** CommandOrigin is the data specifying the origin of the command. In other words, the source that the command request was from, such as the player itself or a websocket server. The client forwards the messages in this packet to the right origin, depending on what is sent here. */
		origin: CommandOrigin;
		/** OutputType specifies the type of output that is sent. OutputType specifies the type of output that is sent. */
		output_type: string;
		/** SuccessCount is the amount of times that a command was executed successfully as a result of the command that was requested. For servers, this is usually a rather meaningless fields, but for vanilla, this is applicable for commands created with Functions. */
		success_count: number;
		/** OutputMessages is a list of all output messages that should be sent to the player. Whether they are shown or not, depends on the type of the messages. */
		output: {
			/** Message is the message that is sent to the client in the chat window. */
			message_id: string;
			/** Success indicates if the output message was one of a successful command execution. */
			success: boolean;
			/** Parameters is a list of parameters that serve to supply the message sent with additional information, such as the position that a player was teleported to or the effect that was applied to an entity. These parameters only apply for the Minecraft built-in command output. */
			parameters: string[];
		}[];
		has_data: boolean;
		data?: string;
	};
	/**
	 * UpdateTrade is sent by the server to update the trades offered by a villager to a player. It is sent at the
	 * moment that a player interacts with a villager.
	 */
	export type packet_update_trade = {
		/** WindowID is the ID that identifies the trading window that the client currently has opened. */
		window_id: WindowID;
		/** WindowType is an identifier specifying the type of the window opened. In vanilla, it appears this is always filled out with 15. */
		window_type: WindowType;
		/** Size is the amount of trading options that the villager has. */
		size: number;
		/** TradeTier is the tier of the villager that the player is trading with. The tier starts at 0 with a first two offers being available, after which two additional offers are unlocked each time the tier becomes one higher. */
		trade_tier: number;
		/** VillagerUniqueID is the unique ID of the villager entity that the player is trading with. The TradeTier sent above applies to this villager. */
		villager_unique_id: bigint;
		/** EntityUniqueID is the unique ID of the entity (usually a player) for which the trades are updated. The updated trades may apply only to this entity. */
		entity_unique_id: bigint;
		/** DisplayName is the name displayed at the top of the trading UI. It is usually used to represent the profession of the villager in the UI. */
		display_name: string;
		/** NewTradeUI specifies if the villager should be using the new trade UI (The one added in 1.11.) rather than the old one. This should usually be set to true. */
		new_trading_ui: boolean;
		/** Trading based on Minecraft economy - specifies if the prices of the villager's offers are modified by an increase in demand for the item. (A mechanic added in 1.11.) Buying more of the same item will increase the price of that particular item. https://minecraft.wiki/w/Trading#Economics */
		economic_trades: boolean;
		/** NBT serialised compound of offers that the villager has. */
		offers: any;
	};
	/**
	 * UpdateEquip is sent by the server to the client upon opening a horse inventory. It is used to set the
	 * content of the inventory and specify additional properties, such as the items that are allowed to be put
	 * in slots of the inventory.
	 */
	export type packet_update_equipment = {
		/** WindowID is the identifier associated with the window that the UpdateEquip packet concerns. It is the ID sent for the horse inventory that was opened before this packet was sent. */
		window_id: WindowID;
		/** WindowType is the type of the window that was opened. Generally, this is the type of a horse inventory, as the packet is specifically made for that. */
		window_type: WindowType;
		/** Size is the size of the horse inventory that should be opened. A bigger size does, in fact, change the amount of slots displayed. */
		size: number;
		/** EntityUniqueID is the unique ID of the entity whose equipment was 'updated' to the player. It is typically the horse entity that had its inventory opened. */
		entity_id: bigint;
		/** `inventory` is a network NBT serialised compound holding the content of the inventory of the entity (the equipment) and additional data such as the allowed items for a particular slot, used to make sure only saddles can be put in the saddle slot etc. */
		inventory: any;
	};
	/**
	 * ResourcePackDataInfo is sent by the server to the client to inform the client about the data contained in
	 * one of the resource packs that are about to be sent.
	 */
	export type packet_resource_pack_data_info = {
		/** UUID is the unique ID of the resource pack that the info concerns. */
		pack_id: string;
		/** DataChunkSize is the maximum size in bytes of the chunks in which the total size of the resource pack to be sent will be divided. A size of 1MB (1024*1024) means that a resource pack of 15.5MB will be split into 16 data chunks. */
		max_chunk_size: number;
		/** ChunkCount is the total amount of data chunks that the sent resource pack will exist out of. It is the total size of the resource pack divided by the DataChunkSize field. The client doesn't actually seem to use this field. Rather, it divides the size by the chunk size to calculate it itself. */
		chunk_count: number;
		/** Size is the total size in bytes that the resource pack occupies. This is the size of the compressed archive (zip) of the resource pack. */
		size: bigint;
		/** Hash is a SHA256 hash of the content of the resource pack. */
		hash: ByteArray;
		/** Premium specifies if the resource pack was a premium resource pack, meaning it was bought from the Minecraft store. */
		is_premium: boolean;
		/** PackType is the type of the resource pack. It is one of the resource pack types listed. */
		pack_type: "addon" | "cached" | "copy_protected" | "behavior" | "persona_piece" | "resources" | "skins" | "world_template";
	};
	/**
	 * ResourcePackChunkData is sent to the client so that the client can download the resource pack. Each packet
	 * holds a chunk of the compressed resource pack, of which the size is defined in the ResourcePackDataInfo
	 * packet sent before.
	 */
	export type packet_resource_pack_chunk_data = {
		/** UUID is the unique ID of the resource pack that the chunk of data is taken out of. */
		pack_id: string;
		/** ChunkIndex is the current chunk index of the chunk. It is a number that starts at 0 and is incremented for each resource pack data chunk sent to the client. */
		chunk_index: number;
		/** DataOffset is the current progress in bytes or offset in the data that the resource pack data chunk is taken from. */
		progress: bigint;
		/** RawPayload is a byte slice containing a chunk of data from the resource pack. It must be of the same size or less than the DataChunkSize set in the ResourcePackDataInfo packet. */
		payload: ByteArray;
	};
	/**
	 * ResourcePackChunkRequest is sent by the client to request a chunk of data from a particular resource pack,
	 * that it has obtained information about in a ResourcePackDataInfo packet.
	 */
	export type packet_resource_pack_chunk_request = {
		/** UUID is the unique ID of the resource pack that the chunk of data is requested from. */
		pack_id: string;
		/** ChunkIndex is the requested chunk index of the chunk. It is a number that starts at 0 and is incremented for each resource pack data chunk requested. */
		chunk_index: number;
	};
	export type packet_transfer = {
		server_address: string;
		port: number;
		reload_world: boolean;
	};
	export type packet_play_sound = {
		name: string;
		coordinates: BlockCoordinates;
		volume: number;
		pitch: number;
	};
	export type packet_stop_sound = {
		name: string;
		stop_all: boolean;
		stop_music_legacy: boolean;
	};
	/**
	 * SetTitle is sent by the server to make a title, subtitle or action bar shown to a player. It has several
	 * fields that allow setting the duration of the titles.
	 */
	export type packet_set_title = {
		/** ActionType is the type of the action that should be executed upon the title of a player. It is one of the constants above and specifies the response of the client to the packet. */
		type: "clear" | "reset" | "set_title" | "set_subtitle" | "action_bar_message" | "set_durations" | "set_title_json" | "set_subtitle_json" | "action_bar_message_json";
		/** Text is the text of the title, which has a different meaning depending on the ActionType that the packet has. The text is the text of a title, subtitle or action bar, depending on the type set. */
		text: string;
		/** FadeInDuration is the duration that the title takes to fade in on the screen of the player. It is measured in 20ths of a second (AKA in ticks). */
		fade_in_time: number;
		/** RemainDuration is the duration that the title remains on the screen of the player. It is measured in 20ths of a second (AKA in ticks). */
		stay_time: number;
		/** FadeOutDuration is the duration that the title takes to fade out of the screen of the player. It is measured in 20ths of a second (AKA in ticks). */
		fade_out_time: number;
		/** XUID is the XBOX Live user ID of the player, which will remain consistent as long as the player is logged in with the XBOX Live account. It is empty if the user is not logged into its XBL account. */
		xuid: string;
		/** PlatformOnlineID is either a uint64 or an empty string. */
		platform_online_id: string;
		/** FilteredMessage is a filtered version of Message with all the profanity removed. The client will use this over Message if this field is not empty and they have the "Filter Profanity" setting enabled. */
		filtered_message: string;
	};
	export type packet_add_behavior_tree = {
		behaviortree: string;
	};
	/**
	 * StructureBlockUpdate is sent by the client when it updates a structure block using the in-game UI. The
	 * data it contains depends on the type of structure block that it is. In Minecraft Bedrock Edition v1.11,
	 * there is only the Export structure block type, but in v1.13 the ones present in Java Edition will,
	 * according to the wiki, be added too.
	 */
	export type packet_structure_block_update = {
		/** Position is the position of the structure block that is updated. */
		position: BlockCoordinates;
		/** StructureName is the name of the structure that was set in the structure block's UI. This is the name used to export the structure to a file. */
		structure_name: string;
		/** FilteredStructureName is a filtered version of StructureName with all the profanity removed. The client will use this over StructureName if this field is not empty and they have the "Filter Profanity" setting enabled. */
		filtered_structure_name: string;
		/** DataField is the name of a function to run, usually used during natural generation. A description can be found here: https://minecraft.wiki/w/Structure_Block#Data. */
		data_field: string;
		/** IncludePlayers specifies if the 'Include Players' toggle has been enabled, meaning players are also exported by the structure block. */
		include_players: boolean;
		/** ShowBoundingBox specifies if the structure block should have its bounds outlined. A thin line will encapsulate the bounds of the structure if set to true. */
		show_bounding_box: boolean;
		/** StructureBlockType is the type of the structure block updated. A list of structure block types that will be used can be found in the constants above. */
		structure_block_type: number;
		/** Settings is a struct of settings that should be used for exporting the structure. These settings are identical to the last sent in the StructureBlockUpdate packet by the client. */
		settings: StructureBlockSettings;
		/** RedstoneSaveMode is the mode that should be used to save the structure when used with redstone. In Java Edition, this is always stored in memory, but in Bedrock Edition it can be stored either to disk or memory. See the constants above for the options. */
		redstone_save_mode: number;
		/** ShouldTrigger specifies if the structure block should be triggered immediately after this packet reaches the server. */
		should_trigger: boolean;
		/** Waterlogged specifies if the structure block is waterlogged at the time of the packet being sent. */
		water_logged: boolean;
	};
	/**
	 * ShowStoreOffer is sent by the server to show a Marketplace store offer to a player. It opens a window
	 * client-side that displays the item.
	 * The ShowStoreOffer packet only works on the partnered servers: Servers that are not partnered will not have
	 * a store buttons show up in the in-game pause menu and will, as a result, not be able to open store offers
	 * on the client side. Sending the packet does therefore not work when using a proxy that is not connected to
	 * with the domain of one of the partnered servers.
	 */
	export type packet_show_store_offer = {
		/** OfferUUID is a UUID that identifies the offer for which a window should be opened. */
		offer_uuid: string;
		/** ShowAll specifies if all other offers of the same 'author' as the one of the offer associated with the OfferUUID should also be displayed, alongside the target offer. */
		redirect_type: "marketplace" | "dressing_room" | "third_party_server_page";
	};
	/**
	 * PurchaseReceipt is sent by the client to the server to notify the server it purchased an item from the
	 * Marketplace store that was offered by the server. The packet is only used for partnered servers.
	 */
	export type packet_purchase_receipt = {
		/** Receipts is a list of receipts, or proofs of purchases, for the offers that have been purchased by the player. */
		receipts: string[];
	};
	export type packet_player_skin = {
		uuid: string;
		skin: Skin;
		skin_name: string;
		old_skin_name: string;
		is_verified: boolean;
	};
	/**
	 * SubClientLogin is sent when a sub-client joins the server while another client is already connected to it.
	 * The packet is sent as a result of split-screen game play, and allows up to four players to play using the
	 * same network connection. After an initial Login packet from the 'main' client, each sub-client that
	 * connects sends a SubClientLogin to request their own login.
	 */
	export type packet_sub_client_login = {
		/** ConnectionRequest is a string containing information about the player and JWTs that may be used to verify if the player is connected to XBOX Live. The connection request also contains the necessary client public key to initiate encryption. The ConnectionRequest in this packet is identical to the one found in the Login packet. */
		tokens: LoginTokens;
	};
	/**
	 * AutomationClientConnect is used to make the client connect to a websocket server. This websocket server has
	 * the ability to execute commands on the behalf of the client and it can listen for certain events fired by
	 * the client.
	 */
	export type packet_initiate_web_socket_connection = {
		/** ServerURI is the URI to make the client connect to. It can be, for example, 'localhost:8000/ws' to connect to a websocket server on the localhost at port 8000. */
		server: string;
	};
	/**
	 * SetLastHurtBy is sent by the server to let the client know what entity type it was last hurt by. At this
	 * moment, the packet is useless and should not be used. There is no behaviour that depends on if this
	 * packet is sent or not.
	 */
	export type packet_set_last_hurt_by = {
		entity_type: number;
	};
	/**
	 * BookEdit is sent by the client when it edits a book. It is sent each time a modification was made and the
	 * player stops its typing 'session', rather than simply after closing the book.
	 */
	export type packet_book_edit = {
		type: "replace_page" | "add_page" | "delete_page" | "swap_pages" | "sign";
		slot: number;
		page_number?: number;
		text?: string;
		photo_name?: string;
		page1?: number;
		page2?: number;
		title?: string;
		author?: string;
		xuid?: string;
	};
	/**
	 * NPCRequest is sent by the client when it interacts with an NPC.
	 * The packet is specifically made for Education Edition, where NPCs are available to use.
	 */
	export type packet_npc_request = {
		/** EntityRuntimeID is the runtime ID of the NPC entity that the player interacted with. It is the same as sent by the server when spawning the entity. */
		runtime_entity_id: bigint;
		/** RequestType is the type of the request, which depends on the permission that the player has. It will be either a type that indicates that the NPC should show its dialog, or that it should open the editing window. */
		request_type: "set_actions" | "execute_action" | "execute_closing_commands" | "set_name" | "set_skin" | "set_interaction_text" | "execute_opening_commands";
		/** CommandString is the command string set in the NPC. It may consist of multiple commands, depending on what the player set in it. */
		command: string;
		/** ActionType is the type of the action to execute. */
		action_type: "set_actions" | "execute_action" | "execute_closing_commands" | "set_name" | "set_skin" | "set_interact_text" | "execute_opening_commands";
		/** SceneName is the name of the scene. */
		scene_name: string;
	};
	/**
	 * PhotoTransfer is sent by the server to transfer a photo (image) file to the client. It is typically used
	 * to transfer photos so that the client can display it in a portfolio in Education Edition.
	 * While previously usable in the default Bedrock Edition, the displaying of photos in books was disabled and
	 * the packet now has little use anymore.
	 */
	export type packet_photo_transfer = {
		/** PhotoName is the name of the photo to transfer. It is the exact file name that the client will download the photo as, including the extension of the file. */
		image_name: string;
		/** PhotoData is the raw data of the photo image. The format of this data may vary: Formats such as JPEG or PNG work, as long as PhotoName has the correct extension. */
		image_data: string;
		/** BookID is the ID of the book that the photo is associated with. If the PhotoName in a book with this ID is set to PhotoName, it will display the photo (provided Education Edition is used). The photo image is downloaded to a sub-folder with this book ID. */
		book_id: string;
		/** PhotoType is one of the three photo types above. */
		photo_type: number;
		/** SourceType is the source photo type. It is one of the three photo types above. */
		source_type: number;
		/** OwnerEntityUniqueID is the entity unique ID of the photo's owner. */
		owner_entity_unique_id: bigint;
		/** NewPhotoName is the new name of the photo. */
		new_photo_name: string;
	};
	/**
	 * ModalFormRequest is sent by the server to make the client open a form. This form may be either a modal form
	 * which has two options, a menu form for a selection of options and a custom form for properties.
	 */
	export type packet_modal_form_request = {
		/** FormID is an ID used to identify the form. The ID is saved by the client and sent back when the player submits the form, so that the server can identify which form was submitted. */
		form_id: number;
		/** FormData is a JSON encoded object of form data. The content of the object differs, depending on the type of the form sent, which is also set in the JSON. */
		data: string;
	};
	/**
	 * ModalFormResponse is sent by the client in response to a ModalFormRequest, after the player has submitted
	 * the form sent. It contains the options/properties selected by the player, or a JSON encoded 'null' if
	 * the form was closed by clicking the X at the top right corner of the form.
	 */
	export type packet_modal_form_response = {
		/** FormID is the form ID of the form the client has responded to. It is the same as the ID sent in the ModalFormRequest, and may be used to identify which form was submitted. */
		form_id: number;
		/** HasResponseData is true if the client provided response data. */
		has_response_data: boolean;
		/** ResponseData is a JSON encoded value representing the response of the player. For a modal form, the response is either true or false, for a menu form, the response is an integer specifying the index of the button clicked, and for a custom form, the response is an array containing a value for each element. */
		data?: string;
		/** HasCancelReason is true if the client provided a reason for the form being cancelled. */
		has_cancel_reason: boolean;
		cancel_reason?: "closed" | "busy";
	};
	/**
	 * ServerSettingsRequest is sent by the client to request the settings specific to the server. These settings
	 * are shown in a separate tab client-side, and have the same structure as a custom form.
	 * ServerSettingsRequest has no fields.
	 */
	export type packet_server_settings_request = {
		
	};
	export type packet_server_settings_response = {
		form_id: number;
		data: string;
	};
	export type packet_show_profile = {
		xuid: string;
	};
	export type packet_set_default_game_type = {
		gamemode: GameMode;
	};
	export type packet_remove_objective = {
		objective_name: string;
	};
	export type packet_set_display_objective = {
		display_slot: string;
		objective_name: string;
		display_name: string;
		criteria_name: string;
		sort_order: number;
	};
	export type packet_set_score = {
		action: "change" | "remove";
		entries: {
			scoreboard_id: bigint;
			objective_name: string;
			score: number;
			entry_type?: "player" | "entity" | "fake_player";
			entity_unique_id?: bigint | undefined;
			custom_name?: string | undefined;
		}[];
	};
	/**
	 * LabTable is sent by the client to let the server know it started a chemical reaction in Education Edition,
	 * and is sent by the server to other clients to show the effects.
	 * The packet is only functional if Education features are enabled.
	 */
	export type packet_lab_table = {
		/** ActionType is the type of the action that was executed. It is one of the constants above. Typically, only LabTableActionCombine is sent by the client, whereas LabTableActionReact is sent by the server. */
		action_type: "combine" | "react" | "reset";
		/** Position is the position at which the lab table used was located. */
		position: vec3i;
		/** ReactionType is the type of the reaction that took place as a result of the items put into the lab table. The reaction type can be either that of an item or a particle, depending on whatever the result was of the reaction. */
		reaction_type: number;
	};
	/**
	 * UpdateBlockSynced is sent by the server to synchronise the falling of a falling block entity with the
	 * transitioning back and forth from and to a solid block. It is used to prevent the entity from flickering,
	 * and is used in places such as the pushing of blocks with pistons.
	 */
	export type packet_update_block_synced = {
		/** Position is the block position at which a block is updated. */
		position: BlockCoordinates;
		/** NewBlockRuntimeID is the runtime ID of the block that is placed at Position after sending the packet to the client. */
		block_runtime_id: number;
		/** Flags is a combination of flags that specify the way the block is updated client-side. It is a combination of the flags above, but typically sending only the BlockUpdateNetwork flag is sufficient. */
		flags: UpdateBlockFlags;
		/** Layer is the world layer on which the block is updated. For most blocks, this is the first layer, as that layer is the default layer to place blocks on, but for blocks inside of each other, this differs. */
		layer: number;
		/** EntityUniqueID is the unique ID of the falling block entity that the block transitions to or that the entity transitions from. Note that for both possible values for TransitionType, the EntityUniqueID should point to the falling block entity involved. */
		entity_unique_id: bigint;
		/** TransitionType is the type of the transition that happened. It is either BlockToEntityTransition, when a block placed becomes a falling entity, or EntityToBlockTransition, when a falling entity hits the ground and becomes a solid block again. */
		transition_type: "entity" | "create" | "destroy";
	};
	/**
	 * MoveActorDelta is sent by the server to move an entity. The packet is specifically optimised to save as
	 * much space as possible, by only writing non-zero fields.
	 * As of 1.16.100, this packet no longer actually contains any deltas.
	 */
	export type packet_move_entity_delta = {
		/** EntityRuntimeID is the runtime ID of the entity that is being moved. The packet works provided a non-player entity with this runtime ID is present. */
		runtime_entity_id: bigint;
		/** Flags is a list of flags that specify what data is in the packet. */
		flags: DeltaMoveFlags;
		x?: number;
		y?: number;
		z?: number;
		rot_x?: number;
		rot_y?: number;
		rot_z?: number;
	};
	export type DeltaMoveFlags = {
		has_x?: boolean;
		has_y?: boolean;
		has_z?: boolean;
		has_rot_x?: boolean;
		has_rot_y?: boolean;
		has_rot_z?: boolean;
		on_ground?: boolean;
		teleport?: boolean;
		force_move?: boolean;
	};
	/**
	 * SetScoreboardIdentity is sent by the server to change the identity type of one of the entries on a
	 * scoreboard. This is used to change, for example, an entry pointing to a player, to a fake player when it
	 * leaves the server, and to change it back to a real player when it joins again.
	 * In non-vanilla situations, the packet is quite useless.
	 */
	export type packet_set_scoreboard_identity = {
		/** ActionType is the type of the action to execute. The action is either ScoreboardIdentityActionRegister to associate an identity with the entry, or ScoreboardIdentityActionClear to remove associations with an entity. */
		action: "register_identity" | "clear_identity";
		/** Entries is a list of all entries in the packet. Each of these entries points to one of the entries on a scoreboard. Depending on ActionType, their identity will either be registered or cleared. */
		entries: {
			scoreboard_id: bigint;
			entity_unique_id?: bigint;
		}[];
	};
	/**
	 * SetLocalPlayerAsInitialised is sent by the client in response to a PlayStatus packet with the status set
	 * to spawn. The packet marks the moment at which the client is fully initialised and can receive any packet
	 * without discarding it.
	 */
	export type packet_set_local_player_as_initialized = {
		/** EntityRuntimeID is the entity runtime ID the player was assigned earlier in the login sequence in the StartGame packet. */
		runtime_entity_id: bigint;
	};
	/**
	 * UpdateSoftEnum is sent by the server to update a soft enum, also known as a dynamic enum, previously sent
	 * in the AvailableCommands packet. It is sent whenever the enum should get new options or when some of its
	 * options should be removed.
	 * The UpdateSoftEnum packet will apply for enums that have been set in the AvailableCommands packet with the
	 * 'Dynamic' field of the CommandEnum set to true.
	 */
	export type packet_update_soft_enum = {
		/** EnumType is the type of the enum. This type must be identical to the one set in the AvailableCommands packet, because the client uses this to recognise which enum to update. */
		enum_type: string;
		/** Options is a list of options that should be updated. Depending on the ActionType field, either these options will be added to the enum, the enum options will be set to these options or all of these options will be removed from the enum. */
		options: string[];
		/** ActionType is the type of the action to execute on the enum. The Options field has a different result, depending on what ActionType is used. */
		action_type: "add" | "remove" | "update";
	};
	/**
	 * NetworkStackLatency is sent by the server (and the client, on development builds) to measure the latency
	 * over the entire Minecraft stack, rather than the RakNet latency. It has other usages too, such as the
	 * ability to be used as some kind of acknowledgement packet, to know when the client has received a certain
	 * other packet.
	 */
	export type packet_network_stack_latency = {
		/** Timestamp is the timestamp of the network stack latency packet. The client will, if NeedsResponse is set to true, send a NetworkStackLatency packet with this same timestamp packet in response. */
		timestamp: bigint;
		/** NeedsResponse specifies if the sending side of this packet wants a response to the packet, meaning that the other side should send a NetworkStackLatency packet back. */
		needs_response: number;
	};
	/**
	 * ScriptCustomEvent is sent by both the client and the server. It is a way to let scripts communicate with
	 * the server, so that the client can let the server know it triggered an event, or the other way around.
	 * It is essentially an RPC kind of system.
	 * Deprecated: ScriptCustomEvent is deprecated as of 1.20.10.
	 */
	export type packet_script_custom_event = {
		/** EventName is the name of the event. The script and the server will use this event name to identify the data that is sent. */
		event_name: string;
		/** EventData is the data of the event. This data is typically a JSON encoded string, that the script is able to encode and decode too. */
		event_data: string;
	};
	/**
	 * SpawnParticleEffect is sent by the server to spawn a particle effect client-side. Unlike other packets that
	 * result in the appearing of particles, this packet can show particles that are not hardcoded in the client.
	 * They can be added and changed through behaviour packs to implement custom particles.
	 */
	export type packet_spawn_particle_effect = {
		/** Dimension is the dimension that the particle is spawned in. Its exact usage is not clear, as the dimension has no direct effect on the particle. */
		dimension: number;
		/** EntityUniqueID is the unique ID of the entity that the spawned particle may be attached to. If this ID is not -1, the Position below will be interpreted as relative to the position of the entity associated with this unique ID. */
		entity_id: bigint;
		/** Position is the position that the particle should be spawned at. If the position is too far away from the player, it will not show up. If EntityUniqueID is not -1, the position will be relative to the position of the entity. */
		position: vec3f;
		/** ParticleName is the name of the particle that should be shown. This name may point to a particle effect that is built-in, or to one implemented by behaviour packs. */
		particle_name: string;
		molang_variables?: string;
	};
	/**
	 * AvailableActorIdentifiers is sent by the server at the start of the game to let the client know all
	 * entities that are available on the server.
	 */
	export type packet_available_entity_identifiers = {
		/** SerialisedEntityIdentifiers is a network NBT serialised compound of all entity identifiers that are available in the server. */
		nbt: any;
	};
	/**
	 * Not used. Use `packet_level_sound_event`.
	 */
	export type packet_level_sound_event_v2 = {
		sound_id: number;
		position: vec3f;
		block_id: number;
		entity_type: string;
		is_baby_mob: boolean;
		is_global: boolean;
	};
	/**
	 * NetworkChunkPublisherUpdate is sent by the server to change the point around which chunks are and remain
	 * loaded. This is useful for mini-game servers, where only one area is ever loaded, in which case the
	 * NetworkChunkPublisherUpdate packet can be sent in the middle of it, so that no chunks ever need to be
	 * additionally sent during the course of the game.
	 * In reality, the packet is not extraordinarily useful, and most servers just send it constantly at the
	 * position of the player.
	 * If the packet is not sent at all, no chunks will be shown to the player, regardless of where they are sent.
	 */
	export type packet_network_chunk_publisher_update = {
		/** Position is the block position around which chunks loaded will remain shown to the client. Most servers set this position to the position of the player itself. #TODO: Check putSignedBlockPosition */
		coordinates: BlockCoordinates;
		/** Radius is the radius in blocks around Position that chunks sent show up in and will remain loaded in. Unlike the RequestChunkRadius and ChunkRadiusUpdated packets, this radius is in blocks rather than chunks, so the chunk radius needs to be multiplied by 16. (Or shifted to the left by 4.) */
		radius: number;
		saved_chunks: {
			/** ChunkX is the X coordinate of the chunk sent. (To translate a block's X to a chunk's X: x >> 4) */
			x: number;
			/** ChunkZ is the Z coordinate of the chunk sent. (To translate a block's Z to a chunk's Z: z >> 4) */
			z: number;
		}[];
	};
	/**
	 * BiomeDefinitionList is sent by the server to let the client know all biomes that are available and
	 * implemented on the server side. It is much like the AvailableActorIdentifiers packet, but instead
	 * functions for biomes.
	 */
	export type packet_biome_definition_list = {
		/** BiomeDefinitions is a list of biomes that are available on the server. */
		biome_definitions: BiomeDefinition[];
		/** StringList is a makeshift dictionary implementation Mojang created to try and reduce the size of the overall packet. It is a list of common strings that are used in the biome definitions. */
		string_list: string[];
	};
	/**
	 * LevelSoundEvent is sent by the server to make any kind of built-in sound heard to a player. It is sent to,
	 * for example, play a stepping sound or a shear sound. The packet is also sent by the client, in which case
	 * it could be forwarded by the server to the other players online. If possible, the packets from the client
	 * should be ignored however, and the server should play them on its own accord.
	 */
	export type packet_level_sound_event = {
		/** SoundType is the type of the sound to play. Some of the sound types require additional data, which is set in the EventData field. */
		sound_id: SoundType;
		/** Position is the position of the sound event. The player will be able to hear the direction of the sound based on what position is sent here. */
		position: vec3f;
		/** ExtraData is a packed integer that some sound types use to provide extra data. An example of this is the note sound, which is composed of a pitch and an instrument type. */
		extra_data: number;
		/** EntityType is the string entity type of the entity that emitted the sound, for example 'minecraft:skeleton'. Some sound types use this entity type for additional data. */
		entity_type: string;
		/** BabyMob specifies if the sound should be that of a baby mob. It is most notably used for parrot imitations, which will change based on if this field is set to true or not. */
		is_baby_mob: boolean;
		/** DisableRelativeVolume specifies if the sound should be played relatively or not. If set to true, the sound will have full volume, regardless of where the Position is, whereas if set to false, the sound's volume will be based on the distance to Position. */
		is_global: boolean;
		/** EntityUniqueID is the unique ID of a source entity. The unique ID is a value that remains consistent across different sessions of the same world, but most servers simply fill the runtime ID of the entity out for this field. */
		entity_unique_id: bigint;
	};
	/**
	 * LevelEventGeneric is sent by the server to send a 'generic' level event to the client. This packet sends an
	 * NBT serialised object and may for that reason be used for any event holding additional data.
	 */
	export type packet_level_event_generic = {
		/** EventID is a unique identifier that identifies the event called. The data that follows has fields in the NBT depending on what event it is. */
		event_id: number;
		/** SerialisedEventData is a network little endian serialised object of event data, with fields that vary depending on EventID. Unlike many other NBT structures, this data is not actually in a compound but just loosely floating NBT tags. To decode using the nbt package, you would need to append 0x0a00 at the start (compound id and name length) and add 0x00 at the end, to manually wrap it in a compound. Likewise, you would have to remove these bytes when encoding. */
		nbt: any;
	};
	/**
	 * LecternUpdate is sent by the client to update the server on which page was opened in a book on a lectern,
	 * or if the book should be removed from it.
	 */
	export type packet_lectern_update = {
		/** Page is the page number in the book that was opened by the player on the lectern. */
		page: number;
		/** PageCount is the number of pages that the book opened in the lectern has. */
		page_count: number;
		/** Position is the position of the lectern that was updated. If no lectern is at the block position, the packet should be ignored. */
		position: vec3i;
	};
	/**
	 * This packet was removed.
	 */
	export type packet_video_stream_connect = {
		server_uri: string;
		frame_send_frequency: number;
		action: "none" | "close";
		resolution_x: number;
		resolution_y: number;
	};
	/**
	 * ClientCacheStatus is sent by the client to the server at the start of the game. It is sent to let the
	 * server know if it supports the client-side blob cache. Clients such as Nintendo Switch do not support the
	 * cache, and attempting to use it anyway will fail.
	 */
	export type packet_client_cache_status = {
		/** Enabled specifies if the blob cache is enabled. If false, the server should not attempt to use the blob cache. If true, it may do so, but it may also choose not to use it. */
		enabled: boolean;
	};
	/**
	 * OnScreenTextureAnimation is sent by the server to show a certain animation on the screen of the player.
	 * The packet is used, as an example, for when a raid is triggered and when a raid is defeated.
	 */
	export type packet_on_screen_texture_animation = {
		/** AnimationType is the type of the animation to show. The packet provides no further extra data to allow modifying the duration or other properties of the animation. */
		animation_type: number;
	};
	/**
	 * MapCreateLockedCopy is sent by the server to create a locked copy of one map into another map. In vanilla,
	 * it is used in the cartography table to create a map that is locked and cannot be modified.
	 */
	export type packet_map_create_locked_copy = {
		/** OriginalMapID is the ID of the map that is being copied. The locked copy will obtain all content that is visible on this map, except the content will not change. */
		original_map_id: bigint;
		/** NewMapID is the ID of the map that holds the locked copy of the map that OriginalMapID points to. Its contents will be impossible to change. */
		new_map_id: bigint;
	};
	/**
	 * StructureTemplateDataRequest is sent by the client to request data of a structure.
	 */
	export type packet_structure_template_data_export_request = {
		/** StructureName is the name of the structure that was set in the structure block's UI. This is the name used to export the structure to a file. */
		name: string;
		/** Position is the position of the structure block that has its template data requested. */
		position: BlockCoordinates;
		/** Settings is a struct of settings that should be used for exporting the structure. These settings are identical to the last sent in the StructureBlockUpdate packet by the client. */
		settings: StructureBlockSettings;
		/** RequestType specifies the type of template data request that the player sent. */
		request_type: "export_from_save" | "export_from_load" | "query_saved_structure" | "import_from_save";
	};
	/**
	 * StructureTemplateDataResponse is sent by the server to send data of a structure to the client in response
	 * to a StructureTemplateDataRequest packet.
	 */
	export type packet_structure_template_data_export_response = {
		name: string;
		success: boolean;
		nbt?: any;
		/** ResponseType specifies the response type of the packet. This depends on the RequestType field sent in the StructureTemplateDataRequest packet and is one of the constants above. */
		response_type: "export" | "query" | "import";
	};
	/**
	 * No longer used.
	 */
	export type packet_update_block_properties = {
		nbt: any;
	};
	/**
	 * ClientCacheBlobStatus is part of the blob cache protocol. It is sent by the client to let the server know
	 * what blobs it needs and which blobs it already has, in an ACK type system.
	 */
	export type packet_client_cache_blob_status = {
		/** The number of MISSes in this packet */
		misses: number;
		/** The number of HITs in this packet */
		haves: number;
		/** A list of blob hashes that the client does not have a blob available for. The server should send the blobs matching these hashes as soon as possible. */
		missing: bigint[];
		/** A list of hashes that the client does have a cached blob for. Server doesn't need to send. */
		have: bigint[];
	};
	/**
	 * ClientCacheMissResponse is part of the blob cache protocol. It is sent by the server in response to a
	 * ClientCacheBlobStatus packet and contains the blob data of all blobs that the client acknowledged not to
	 * have yet.
	 */
	export type packet_client_cache_miss_response = {
		blobs: Blob[];
	};
	/**
	 * EducationSettings is a packet sent by the server to update Minecraft: Education Edition related settings.
	 * It is unused by the normal base game.
	 */
	export type packet_education_settings = {
		/** CodeBuilderDefaultURI is the default URI that the code builder is ran on. Using this, a Code Builder program can make code directly affect the server. */
		CodeBuilderDefaultURI: string;
		/** CodeBuilderTitle is the title of the code builder shown when connected to the CodeBuilderDefaultURI. */
		CodeBuilderTitle: string;
		/** CanResizeCodeBuilder specifies if clients connected to the world should be able to resize the code builder when it is opened. */
		CanResizeCodeBuilder: boolean;
		disable_legacy_title_bar: boolean;
		post_process_filter: string;
		screenshot_border_path: string;
		has_agent_capabilities: boolean;
		agent_capabilities?: {
			has: boolean;
			can_modify_blocks: boolean;
		};
		HasOverrideURI: boolean;
		OverrideURI?: string;
		HasQuiz: boolean;
		has_external_link_settings: boolean;
		external_link_settings?: {
			has: boolean;
			url: string;
			display_name: string;
		};
	};
	/**
	 * Emote is sent by both the server and the client. When the client sends an emote, it sends this packet to
	 * the server, after which the server will broadcast the packet to other players online.
	 */
	export type packet_emote = {
		/** EntityRuntimeID is the entity that sent the emote. When a player sends this packet, it has this field set as its own entity runtime ID. */
		entity_id: bigint;
		/** EmoteID is the ID of the emote to send. */
		emote_id: string;
		/** EmoteLength is the number of ticks that the emote lasts for. */
		emote_length_ticks: number;
		/** XUID is the Xbox User ID of the player that sent the emote. It is only set when the emote is used by a player that is authenticated with Xbox Live. */
		xuid: string;
		/** PlatformID is an identifier only set for particular platforms when using an emote (presumably only for Nintendo Switch). It is otherwise an empty string, and is used to decide which players are able to emote with each other. */
		platform_id: string;
		/** Flags is a combination of flags that change the way the Emote packet operates. When the server sends this packet to other players, EmoteFlagServerSide must be present. */
		flags: "server_side" | "mute_chat";
	};
	/**
	 * MultiPlayerSettings is sent by the client to update multi-player related settings server-side and sent back
	 * to online players by the server.
	 * The MultiPlayerSettings packet is a Minecraft: Education Edition packet. It has no functionality for the
	 * base game.
	 */
	export type packet_multiplayer_settings = {
		/** ActionType is the action that should be done when this packet is sent. It is one of the constants that may be found above. */
		action_type: "enable_multiplayer" | "disable_multiplayer" | "refresh_join_code";
	};
	/**
	 * SettingsCommand is sent by the client when it changes a setting in the settings that results in the issuing
	 * of a command to the server, such as when Show Coordinates is enabled.
	 */
	export type packet_settings_command = {
		/** CommandLine is the full command line that was sent to the server as a result of the setting that the client changed. */
		command_line: string;
		/** SuppressOutput specifies if the client requests the suppressing of the output of the command that was executed. Generally this is set to true, as the client won't need a message to confirm the output of the change. */
		suppress_output: boolean;
	};
	/**
	 * AnvilDamage is sent by the client to request the dealing damage to an anvil. This packet is completely
	 * pointless and the server should never listen to it.
	 */
	export type packet_anvil_damage = {
		/** Damage is the damage that the client requests to be dealt to the anvil. */
		damage: number;
		/** AnvilPosition is the position in the world that the anvil can be found at. */
		position: BlockCoordinates;
	};
	/**
	 * CompletedUsingItem is sent by the server to tell the client that it should be done using the item it is
	 * currently using.
	 */
	export type packet_completed_using_item = {
		/** UsedItemID is the item ID of the item that the client completed using. This should typically be the ID of the item held in the hand. */
		used_item_id: number;
		/** UseMethod is the method of the using of the item that was completed. It is one of the constants that may be found above. */
		use_method: "equip_armor" | "eat" | "attack" | "consume" | "throw" | "shoot" | "place" | "fill_bottle" | "fill_bucket" | "pour_bucket" | "use_tool" | "interact" | "retrieved" | "dyed" | "traded" | "brushing_completed" | "opened_vault";
	};
	/**
	 * NetworkSettings is sent by the server to update a variety of network settings. These settings modify the
	 * way packets are sent over the network stack.
	 */
	export type packet_network_settings = {
		/** CompressionThreshold is the minimum size of a packet that is compressed when sent. If the size of a packet is under this value, it is not compressed. When set to 0, all packets will be left uncompressed. */
		compression_threshold: number;
		/** CompressionAlgorithm is the algorithm that is used to compress packets. */
		compression_algorithm: "deflate" | "snappy";
		/** ClientThrottle regulates whether the client should throttle players when exceeding of the threshold. Players outside threshold will not be ticked, improving performance on low-end devices. */
		client_throttle: boolean;
		/** ClientThrottleThreshold is the threshold for client throttling. If the number of players exceeds this value, the client will throttle players. */
		client_throttle_threshold: number;
		/** ClientThrottleScalar is the scalar for client throttling. The scalar is the amount of players that are ticked when throttling is enabled. */
		client_throttle_scalar: number;
	};
	/**
	 * PlayerAuthInput is sent by the client to allow for server authoritative movement. It is used to synchronise
	 * the player input with the position server-side.
	 * The client sends this packet when the ServerAuthoritativeMovementMode field in the StartGame packet is set
	 * to true, instead of the MovePlayer packet. The client will send this packet once every tick.
	 */
	export type packet_player_auth_input = {
		/** Pitch that the player reports it has. */
		pitch: number;
		/** Yaw that player reports it has. */
		yaw: number;
		/** Position holds the position that the player reports it has. */
		position: vec3f;
		/** MoveVector is a Vec2 that specifies the direction in which the player moved, as a combination of X/Z values which are created using the WASD/controller stick state. */
		move_vector: vec2f;
		/** HeadYaw is the horizontal rotation of the head that the player reports it has. */
		head_yaw: number;
		/** InputData is a combination of bit flags that together specify the way the player moved last tick. It is a combination of the flags above. */
		input_data: InputFlag;
		/** InputMode specifies the way that the client inputs data to the screen. It is one of the constants that may be found above. */
		input_mode: "unknown" | "mouse" | "touch" | "game_pad" | "motion_controller";
		/** PlayMode specifies the way that the player is playing. The values it holds, which are rather random, may be found above. */
		play_mode: "normal" | "teaser" | "screen" | "viewer" | "reality" | "placement" | "living_room" | "exit_level" | "exit_level_living_room" | "num_modes";
		/** InteractionModel is a constant representing the interaction model the player is using. */
		interaction_model: "touch" | "crosshair" | "classic";
		/** interact_rotation is the rotation the player is looking that they intend to use for interactions. This is only different to Pitch and Yaw in cases such as VR or when custom cameras being used. */
		interact_rotation: vec2f;
		/** Tick is the server tick at which the packet was sent. It is used in relation to CorrectPlayerMovePrediction. */
		tick: bigint;
		/** Delta was the delta between the old and the new position. There isn't any practical use for this field as it can be calculated by the server itself. */
		delta: vec3f;
		transaction?: {
			legacy: TransactionLegacy;
			actions: TransactionActions;
			data: TransactionUseItem;
		};
		item_stack_request?: ItemStackRequest;
		vehicle_rotation?: vec2f;
		predicted_vehicle?: bigint;
		block_action?: {
			action: Action;
			position?: vec3i;
			face?: number;
		}[];
		analogue_move_vector: vec2f;
		camera_orientation: vec3f;
		raw_move_vector: vec2f;
	};
	export type InputFlag = {
		ascend?: boolean;
		descend?: boolean;
		north_jump?: boolean;
		jump_down?: boolean;
		sprint_down?: boolean;
		change_height?: boolean;
		jumping?: boolean;
		auto_jumping_in_water?: boolean;
		sneaking?: boolean;
		sneak_down?: boolean;
		up?: boolean;
		down?: boolean;
		left?: boolean;
		right?: boolean;
		up_left?: boolean;
		up_right?: boolean;
		want_up?: boolean;
		want_down?: boolean;
		want_down_slow?: boolean;
		want_up_slow?: boolean;
		sprinting?: boolean;
		ascend_block?: boolean;
		descend_block?: boolean;
		sneak_toggle_down?: boolean;
		persist_sneak?: boolean;
		start_sprinting?: boolean;
		stop_sprinting?: boolean;
		start_sneaking?: boolean;
		stop_sneaking?: boolean;
		start_swimming?: boolean;
		stop_swimming?: boolean;
		start_jumping?: boolean;
		start_gliding?: boolean;
		stop_gliding?: boolean;
		item_interact?: boolean;
		block_action?: boolean;
		item_stack_request?: boolean;
		handled_teleport?: boolean;
		emoting?: boolean;
		missed_swing?: boolean;
		start_crawling?: boolean;
		stop_crawling?: boolean;
		start_flying?: boolean;
		stop_flying?: boolean;
		received_server_data?: boolean;
		client_predicted_vehicle?: boolean;
		paddling_left?: boolean;
		paddling_right?: boolean;
		block_breaking_delay_enabled?: boolean;
		horizontal_collision?: boolean;
		vertical_collision?: boolean;
		down_left?: boolean;
		down_right?: boolean;
		start_using_item?: boolean;
		camera_relative_movement_enabled?: boolean;
		rot_controlled_by_move_direction?: boolean;
		start_spin_attack?: boolean;
		stop_spin_attack?: boolean;
		hotbar_only_touch?: boolean;
		jump_released_raw?: boolean;
		jump_pressed_raw?: boolean;
		jump_current_raw?: boolean;
		sneak_released_raw?: boolean;
		sneak_pressed_raw?: boolean;
		sneak_current_raw?: boolean;
	};
	/**
	 * CreativeContent is a packet sent by the server to set the creative inventory's content for a player.
	 * Introduced in 1.16, this packet replaces the previous method - sending an InventoryContent packet with
	 * creative inventory window ID.
	 * As of v1.16.100, this packet must be sent during the login sequence. Not sending it will stop the client
	 * from joining the server.
	 */
	export type packet_creative_content = {
		/** The groups that are displayed within the creative inventory menu. */
		groups: {
			/** Where the group shows up in the creative inventory (e.g. Construction, Items, etc) */
			category: "all" | "construction" | "nature" | "equipment" | "items" | "item_command_only";
			/** The name of the group (e.g. Decorative stone, Wool, etc.) */
			name: string;
			/** The item whose icon is used to label the group (icon you click on to open/close the group) */
			icon_item: ItemLegacy;
		}[];
		/** Individual items that are displayed within the creative inventory menu, grouped by their category. */
		items: {
			/** The index of the item in the creative menu. */
			entry_id: number;
			item: ItemLegacy;
			/** The group index of the item - which group in the groups array this item belongs to. */
			group_index: number;
		}[];
	};
	/**
	 * PlayerEnchantOptions is sent by the server to update the enchantment options displayed when the user opens
	 * the enchantment table and puts an item in. This packet was added in 1.16 and allows the server to decide on
	 * the enchantments that can be selected by the player.
	 * The PlayerEnchantOptions packet should be sent once for every slot update of the enchantment table. The
	 * vanilla server sends an empty PlayerEnchantOptions packet when the player opens the enchantment table
	 * (air is present in the enchantment table slot) and sends the packet with actual enchantments in it when
	 * items are put in that can have enchantments.
	 */
	export type packet_player_enchant_options = {
		/** Options is a list of possible enchantment options for the item that was put into the enchantment table. */
		options: EnchantOption[];
	};
	/**
	 * ItemStackRequest is sent by the client to change item stacks in an inventory. It is essentially a
	 * replacement of the InventoryTransaction packet added in 1.16 for inventory specific actions, such as moving
	 * items around or crafting. The InventoryTransaction packet is still used for actions such as placing blocks
	 * and interacting with entities.
	 */
	export type packet_item_stack_request = {
		requests: ItemStackRequest[];
	};
	/**
	 * ItemStackResponse is sent by the server in response to an ItemStackRequest packet from the client. This
	 * packet is used to either approve or reject ItemStackRequests from the client. If a request is approved, the
	 * client will simply continue as normal. If rejected, the client will undo the actions so that the inventory
	 * should be in sync with the server again.
	 */
	export type packet_item_stack_response = {
		/** Responses is a list of responses to ItemStackRequests sent by the client before. Responses either approve or reject a request from the client. Vanilla limits the size of this slice to 4096. */
		responses: ItemStackResponses;
	};
	/**
	 * PlayerArmourDamage is sent by the server to damage the armour of a player. It is a very efficient packet,
	 * but generally it's much easier to just send a slot update for the damaged armour.
	 */
	export type packet_player_armor_damage = {
		entries: ArmorDamageEntry[];
	};
	export type ArmorDamageEntry = {
		armor_slot: "helmet" | "chestplate" | "leggings" | "boots" | "body";
		damage: number;
	};
	/**
	 * CodeBuilder is an Education Edition packet sent by the server to the client to open the URL to a Code
	 * Builder (websocket) server.
	 */
	export type packet_code_builder = {
		/** URL is the url to the Code Builder (websocket) server. */
		url: string;
		/** ShouldOpenCodeBuilder specifies if the client should automatically open the Code Builder app. If set to true, the client will attempt to use the Code Builder app to connect to and interface with the server running at the URL above. */
		should_open_code_builder: boolean;
	};
	/**
	 * UpdatePlayerGameType is sent by the server to change the game mode of a player. It is functionally
	 * identical to the SetPlayerGameType packet.
	 */
	export type packet_update_player_game_type = {
		/** GameType is the new game type of the player. It is one of the constants that can be found in set_player_game_type.go. Some of these game types require additional flags to be set in an AdventureSettings packet for the game mode to obtain its full functionality. */
		gamemode: GameMode;
		/** PlayerUniqueID is the entity unique ID of the player that should have its game mode updated. If this packet is sent to other clients with the player unique ID of another player, nothing happens. */
		player_unique_id: bigint;
		tick: bigint;
	};
	/**
	 * EmoteList is sent by the client every time it joins the server and when it equips new emotes. It may be
	 * used by the server to find out which emotes the client has available. If the player has no emotes equipped,
	 * this packet is not sent.
	 * Under certain circumstances, this packet is also sent from the server to the client, but I was unable to
	 * find when this is done.
	 */
	export type packet_emote_list = {
		/** PlayerRuntimeID is the runtime ID of the player that owns the emote pieces below. If sent by the client, this player runtime ID is always that of the player itself. */
		player_id: bigint;
		/** EmotePieces is a list of emote pieces that the player with the runtime ID above has. */
		emote_pieces: string[];
	};
	/**
	 * PositionTrackingDBClientRequest is a packet sent by the client to request the position and dimension of a
	 * 'tracking ID'. These IDs are tracked in a database by the server. In 1.16, this is used for lodestones.
	 * The client will send this request to find the position a lodestone compass needs to point to. If found, it
	 * will point to the lodestone. If not, it will start spinning around.
	 * A PositionTrackingDBServerBroadcast packet should be sent in response to this packet.
	 */
	export type packet_position_tracking_db_request = {
		/** RequestAction is the action that should be performed upon the receiving of the packet. It is one of the constants found above. */
		action: "query";
		/** TrackingID is a unique ID used to identify the request. The server responds with a PositionTrackingDBServerBroadcast packet holding the same ID, so that the client can find out what that packet was in response to. */
		tracking_id: number;
	};
	/**
	 * PositionTrackingDBServerBroadcast is sent by the server in response to the
	 * PositionTrackingDBClientRequest packet. This packet is, as of 1.16, currently only used for lodestones. The
	 * server maintains a database with tracking IDs and their position and dimension. The client will request
	 * these tracking IDs, (NBT tag set on the lodestone compass with the tracking ID?) and the server will
	 * respond with the status of those tracking IDs.
	 * What is actually done with the data sent depends on what the client chooses to do with it. For the
	 * lodestone compass, it is used to make the compass point towards lodestones and to make it spin if the
	 * lodestone at a position is no longer there.
	 */
	export type packet_position_tracking_db_broadcast = {
		/** BroadcastAction specifies the status of the position tracking DB response. It is one of the constants above, specifying the result of the request with the ID below. The Update action is sent for setting the position of a lodestone compass, the Destroy and NotFound to indicate that there is not (no longer) a lodestone at that position. */
		broadcast_action: "update" | "destory" | "not_found";
		/** TrackingID is the ID of the PositionTrackingDBClientRequest packet that this packet was in response to. The tracking ID is also present as the 'id' field in the SerialisedData field. */
		tracking_id: number;
		nbt: any;
	};
	/**
	 * DebugInfo is a packet sent by the server to the client. It does not seem to do anything when sent to the
	 * normal client in 1.16.
	 */
	export type packet_debug_info = {
		/** PlayerUniqueID is the unique ID of the player that the packet is sent to. */
		player_unique_id: bigint;
		/** Data is the debug data. */
		data: ByteArray;
	};
	/**
	 * PacketViolationWarning is sent by the client when it receives an invalid packet from the server. It holds
	 * some information on the error that occurred.
	 */
	export type packet_packet_violation_warning = {
		violation_type: "malformed";
		/** Severity specifies the severity of the packet violation. The action the client takes after this violation depends on the severity sent. */
		severity: "warning" | "final_warning" | "terminating";
		/** PacketID is the ID of the invalid packet that was received. */
		packet_id: number;
		/** ViolationContext holds a description on the violation of the packet. */
		reason: string;
	};
	/**
	 * MotionPredictionHints is sent by the server to the client. There is a predictive movement component for
	 * entities. This packet fills the "history" of that component and entity movement is computed based on the
	 * points. Vanilla sends this packet instead of the SetActorMotion packet when 'spatial optimisations' are
	 * enabled.
	 */
	export type packet_motion_prediction_hints = {
		/** EntityRuntimeID is the runtime ID of the entity whose velocity is sent to the client. */
		entity_runtime_id: bigint;
		/** Velocity is the server-calculated velocity of the entity at the point of sending the packet. */
		velocity: vec3f;
		/** OnGround specifies if the server currently thinks the entity is on the ground. */
		on_ground: boolean;
	};
	/**
	 * AnimateEntity is sent by the server to animate an entity client-side. It may be used to play a single
	 * animation, or to activate a controller which can start a sequence of animations based on different
	 * conditions specified in an animation controller.
	 * Much of the documentation of this packet can be found at
	 * https://learn.microsoft.com/minecraft/creator/reference/content/animationsreference.
	 */
	export type packet_animate_entity = {
		/** Animation is the name of a single animation to start playing. */
		animation: string;
		/** NextState is the first state to start with. These states are declared in animation controllers (which, in themselves, are animations too). These states in turn may have animations and transitions to move to a next state. */
		next_state: string;
		/** StopCondition is a MoLang expression that specifies when the animation should be stopped. */
		stop_condition: string;
		/** StopConditionVersion is the MoLang stop condition version. */
		stop_condition_version: number;
		/** Controller is the animation controller that is used to manage animations. These controllers decide when to play which animation. */
		controller: string;
		/** How long to move from the previous animation to the next. */
		blend_out_time: number;
		/** EntityRuntimeIDs is list of runtime IDs of entities that the animation should be applied to. */
		runtime_entity_ids: bigint[];
	};
	/**
	 * CameraShake is sent by the server to make the camera shake client-side. This feature was added for map-
	 * making partners.
	 */
	export type packet_camera_shake = {
		/** Intensity is the intensity of the shaking. The client limits this value to 4, so anything higher may not work. */
		intensity: number;
		/** Duration is the number of seconds the camera will shake for. */
		duration: number;
		/** Type is the type of shake, and is one of the constants listed above. The different type affects how the shake looks in game. */
		type: number;
		/** Action is the action to be performed, and is one of the constants listed above. Currently the different actions will either add or stop shaking the client. */
		action: "add" | "stop";
	};
	/**
	 * PlayerFog is sent by the server to render the different fogs in the Stack. The types of fog are controlled
	 * by resource packs to change how they are rendered, and the ability to create custom fog.
	 */
	export type packet_player_fog = {
		/** Stack is a list of fog identifiers to be sent to the client. Examples of fog identifiers are "minecraft:fog_ocean" and "minecraft:fog_hell". */
		stack: string[];
	};
	/**
	 * CorrectPlayerMovePrediction is sent by the server if and only if StartGame.ServerAuthoritativeMovementMode
	 * is set to AuthoritativeMovementModeServerWithRewind. The packet is used to correct movement at a specific
	 * point in time.
	 */
	export type packet_correct_player_move_prediction = {
		prediction_type: "player" | "vehicle";
		/** Position is the position that the player is supposed to be at at the tick written in the field below. The client will change its current position based on movement after that tick starting from the Position. */
		position: vec3f;
		/** Delta is the change in position compared to what the client sent as its position at that specific tick. */
		delta: vec3f;
		rotation: vec2f;
		angular_velocity?: number;
		/** OnGround specifies if the player was on the ground at the time of the tick below. */
		on_ground: boolean;
		/** Tick is the tick of the movement which was corrected by this packet. */
		tick: bigint;
	};
	/**
	 * ItemRegistryPacket is used to declare what items the server makes available, and components of custom items.
	 * After 1.21.60, this packet replaces the functionality of the "itemstates" field in the StartGamePacket
	 * In pre-1.21.60 versions, this was the ItemComponentPacket, and was
	 * sent by the server to attach client-side components to custom items.
	 */
	export type packet_item_registry = {
		/** `items` holds a list of all items. */
		itemstates: Itemstates;
	};
	/**
	 * FilterText is sent by the both the client and the server. The client sends the packet to the server to
	 * allow the server to filter the text server-side. The server then responds with the same packet and the
	 * safer version of the text.
	 */
	export type packet_filter_text_packet = {
		/** Text is either the text from the client or the safer version of the text sent by the server. */
		text: string;
		/** FromServer indicates if the packet was sent by the server or not. */
		from_server: boolean;
	};
	/**
	 * ClientBoundDebugRenderer is sent by the server to spawn an outlined cube on client-side.
	 */
	export type packet_debug_renderer = {
		type: string;
		has_data: boolean;
		data?: DebugMarkerData;
	};
	/**
	 * Sent by the server to synchronize/update entity properties as NBT, an alternative to Set Entity Data.
	 */
	export type packet_sync_entity_property = {
		nbt: any;
	};
	/**
	 * AddVolumeEntity sends a volume entity's definition and components from server to client.
	 */
	export type packet_add_volume_entity = {
		/** EntityRuntimeID is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_id: bigint;
		/** EntityMetadata is a map of entity metadata, which includes flags and data properties that alter in particular the way the entity looks. */
		nbt: any;
		encoding_identifier: string;
		instance_name: string;
		bounds: {
			min: BlockCoordinates;
			max: BlockCoordinates;
		};
		dimension: number;
		engine_version: string;
	};
	/**
	 * RemoveVolumeEntity indicates a volume entity to be removed from server to client.
	 */
	export type packet_remove_volume_entity = {
		/** The Runtime Entity ID */
		entity_id: bigint;
	};
	/**
	 * SimulationType is an in-progress packet. We currently do not know the use case.
	 */
	export type packet_simulation_type = {
		/** SimulationType is the simulation type selected */
		type: "game" | "editor" | "test" | "invalid";
	};
	/**
	 * NPCDialogue is a packet that allows the client to display dialog boxes for interacting with NPCs.
	 */
	export type packet_npc_dialogue = {
		/** ActorUniqueID is the ID of the NPC being requested. */
		entity_id: bigint;
		/** ActionType is the type of action for the packet. */
		action_type: "open" | "close";
		/** Dialogue is the text that the client should see. */
		dialogue: string;
		/** SceneName is the scene the data was pulled from for the client. */
		screen_name: string;
		/** NPCName is the name of the NPC to be displayed to the client. */
		npc_name: string;
		/** ActionJSON is the JSON string of the buttons/actions the server can perform. */
		action_json: string;
	};
	export type packet_edu_uri_resource_packet = {
		resource: EducationSharedResourceURI;
	};
	export type packet_create_photo = {
		entity_unique_id: bigint;
		photo_name: string;
		item_name: string;
	};
	export type packet_update_subchunk_blocks = {
		x: number;
		y: number;
		z: number;
		blocks: BlockUpdate[];
		extra: BlockUpdate[];
	};
	export type packet_photo_info_request = {
		photo_id: bigint;
	};
	export type HeightMapDataType = "no_data" | "has_data" | "too_high" | "too_low" | "all_copied";
	export type SubChunkEntryWithoutCaching = {
		dx: number;
		dy: number;
		dz: number;
		result: "undefined" | "success" | "chunk_not_found" | "invalid_dimension" | "player_not_found" | "y_index_out_of_bounds" | "success_all_air";
		payload: ByteArray;
		heightmap_type: HeightMapDataType;
		heightmap?: Buffer;
		render_heightmap_type: HeightMapDataType;
		render_heightmap?: Buffer;
	}[];
	export type SubChunkEntryWithCaching = {
		dx: number;
		dy: number;
		dz: number;
		result: "undefined" | "success" | "chunk_not_found" | "invalid_dimension" | "player_not_found" | "y_index_out_of_bounds" | "success_all_air";
		/** Payload has the terrain data, if the chunk isn't empty and caching is disabled */
		payload?: ByteArray;
		heightmap_type: HeightMapDataType;
		heightmap?: Buffer;
		render_heightmap_type: HeightMapDataType;
		render_heightmap?: Buffer;
		blob_id: bigint;
	}[];
	/**
	 * SubChunk sends data about multiple sub-chunks around a center point.
	 */
	export type packet_subchunk = {
		cache_enabled: boolean;
		dimension: number;
		/** Origin point */
		origin: vec3i;
		blob_id: any;
		entries?: SubChunkEntryWithCaching | SubChunkEntryWithoutCaching;
	};
	export type packet_subchunk_request = {
		dimension: number;
		/** Origin point */
		origin: vec3i;
		requests: {
			dx: number;
			dy: number;
			dz: number;
		}[];
	};
	/**
	 * ClientStartItemCooldown is sent by the client to the server to initiate a cooldown on an item. The purpose of this
	 * packet isn't entirely clear.
	 */
	export type packet_client_start_item_cooldown = {
		category: string;
		/** Duration is the duration of ticks the cooldown should last. */
		duration: number;
	};
	/**
	 * ScriptMessage is used to communicate custom messages from the client to the server, or from the server to the client.
	 * While the name may suggest this packet is used for the discontinued scripting API, it is likely instead for the
	 * GameTest framework.
	 */
	export type packet_script_message = {
		/** Message ID is the identifier of the message, used by either party to identify the message data sent. */
		message_id: string;
		/** Data contains the data of the message. */
		data: string;
	};
	/**
	 * CodeBuilderSource is an Education Edition packet sent by the client to the server to run an operation with a
	 */
	export type packet_code_builder_source = {
		/** Operation is used to distinguish the operation performed. It is always one of the constants listed above. */
		operation: "none" | "get" | "set" | "reset";
		/** Category is used to distinguish the category of the operation performed. It is always one of the constants */
		category: "none" | "code_status" | "instantiation";
		code_status: "none" | "not_started" | "in_progress" | "paused" | "error" | "succeeded";
	};
	/**
	 * TickingAreasLoadStatus is sent by the server to the client to notify the client of a ticking area's loading status.
	 */
	export type packet_ticking_areas_load_status = {
		/** Preload is true if the server is waiting for the area's preload. */
		preload: boolean;
	};
	/**
	 * DimensionData is a packet sent from the server to the client containing information about data-driven dimensions
	 * that the server may have registered. This packet does not seem to be sent by default, rather only being sent when
	 * any data-driven dimensions are registered.
	 */
	export type packet_dimension_data = {
		definitions: {
			id: string;
			max_height: number;
			min_height: number;
			generator: "legacy" | "overworld" | "flat" | "nether" | "end" | "void";
		}[];
	};
	/**
	 * AgentAction is an Education Edition packet sent from the server to the client to return a response to a
	 * previously requested action.
	 */
	export type packet_agent_action = {
		request_id: string;
		action_type: "none" | "attack" | "collect" | "destroy" | "detect_redstone" | "detect_obstacle" | "drop" | "drop_all" | "inspect" | "inspect_data" | "inspect_item_count" | "inspect_item_detail" | "inspect_item_space" | "interact" | "move" | "place_block" | "till" | "transfer_item_to" | "turn";
		body: string;
	};
	/**
	 * ChangeMobProperty is a packet sent from the server to the client to change one of the properties of a mob client-side.
	 */
	export type packet_change_mob_property = {
		/** EntityUniqueID is the unique ID of the entity whose property is being changed. */
		entity_unique_id: bigint;
		/** Property is the name of the property being updated. */
		property: string;
		/** BoolValue is set if the property value is a bool type. If the type is not a bool, this field is ignored. */
		bool_value: boolean;
		/** StringValue is set if the property value is a string type. If the type is not a string, this field is ignored. */
		string_value: string;
		/** IntValue is set if the property value is an int type. If the type is not an int, this field is ignored. */
		int_value: number;
		/** FloatValue is set if the property value is a float type. If the type is not a float, this field is ignored. */
		float_value: number;
	};
	/**
	 * LessonProgress is a packet sent by the server to the client to inform the client of updated progress on a lesson.
	 * This packet only functions on the Minecraft: Education Edition version of the game.
	 */
	export type packet_lesson_progress = {
		/** Action is the action the client should perform to show progress. This is one of the constants defined above. */
		action: number;
		/** Score is the score the client should use when displaying the progress. */
		score: number;
		/** Identifier is the identifier of the lesson that is being progressed. */
		identifier: string;
	};
	/**
	 * RequestAbility is a packet sent by the client to the server to request permission for a specific ability from the
	 * server.
	 */
	export type packet_request_ability = {
		/** Ability is the ability that the client is requesting. This is one of the constants defined above. */
		ability: "build" | "mine" | "doors_and_switches" | "open_containers" | "attack_players" | "attack_mobs" | "operator_commands" | "teleport" | "invulnerable" | "flying" | "may_fly" | "instant_build" | "lightning" | "fly_speed" | "walk_speed" | "muted" | "world_builder" | "no_clip" | "ability_count";
		/** Value type decides which of the fields you should read/write from */
		value_type: "bool" | "float";
		/** If value type is bool, use this value */
		bool_value: boolean;
		/** If value type is float, use this value */
		float_val: number;
	};
	/**
	 * RequestPermissions is a packet sent from the client to the server to request permissions that the client does not
	 * currently have. It can only be sent by operators and host in vanilla Minecraft.
	 */
	export type packet_request_permissions = {
		/** EntityUniqueID is the unique ID of the player. The unique ID is unique for the entire world and is often used in packets. Most servers send an EntityUniqueID equal to the EntityRuntimeID. */
		entity_unique_id: bigint;
		/** PermissionLevel is the current permission level of the player. Same as constants in AdventureSettings packet. */
		permission_level: PermissionLevel;
		/** RequestedPermissions contains the requested permission flags. */
		requested_permissions: RequestPermissions;
	};
	export type RequestPermissions = {
		build?: boolean;
		mine?: boolean;
		doors_and_switches?: boolean;
		open_containers?: boolean;
		attack_players?: boolean;
		attack_mobs?: boolean;
		operator?: boolean;
		teleport?: boolean;
	};
	/**
	 * ToastRequest is a packet sent from the server to the client to display a toast to the top of the screen. These toasts
	 * are the same as the ones seen when, for example, loading a new resource pack or obtaining an achievement.
	 */
	export type packet_toast_request = {
		/** Title is the title of the toast. */
		title: string;
		/** Message is the message that the toast may contain alongside the title. */
		message: string;
	};
	/**
	 * UpdateAbilities is a packet sent from the server to the client to update the abilities of the player. It, along with
	 * the UpdateAdventureSettings packet, are replacements of the AdventureSettings packet since v1.19.10.
	 */
	export type packet_update_abilities = {
		/** EntityUniqueID is the unique ID of the player. The unique ID is a value that remains consistent across different sessions of the same world, but most servers simply fill the runtime ID of the entity out for this field. */
		entity_unique_id: bigint;
		/** PlayerPermissions is the permission level of the player. It is a value from 0-3, with 0 being visitor, 1 being member, 2 being operator and 3 being custom. */
		permission_level: PermissionLevel;
		/** CommandPermissions is a permission level that specifies the kind of commands that the player is allowed to use. It is one of the CommandPermissionLevel constants in the AdventureSettings packet. */
		command_permission: CommandPermissionLevel;
		/** Layers contains all ability layers and their potential values. This should at least have one entry, being the base layer. */
		abilities: AbilityLayers[];
	};
	/**
	 * UpdateAdventureSettings is a packet sent from the server to the client to update the adventure settings of the player.
	 * It, along with the UpdateAbilities packet, are replacements of the AdventureSettings packet since v1.19.10.
	 */
	export type packet_update_adventure_settings = {
		/** NoPvM is a boolean indicating whether the player is allowed to fight mobs or not. */
		no_pvm: boolean;
		/** NoMvP is a boolean indicating whether mobs are allowed to fight the player or not. It is unclear why this is sent to the client. */
		no_mvp: boolean;
		/** ImmutableWorld is a boolean indicating whether the player is allowed to modify the world or not. */
		immutable_world: boolean;
		/** ShowNameTags is a boolean indicating whether player name tags are shown or not. */
		show_name_tags: boolean;
		/** AutoJump is a boolean indicating whether the player is allowed to jump automatically or not. */
		auto_jump: boolean;
	};
	/**
	 * DeathInfo is a packet sent from the server to the client expected to be sent when a player dies. It contains messages
	 * related to the player's death, which are shown on the death screen as of v1.19.10.
	 */
	export type packet_death_info = {
		/** Cause is the cause of the player's death, such as "suffocation" or "suicide". */
		cause: string;
		/** Messages is a list of death messages to be shown on the death screen. */
		messages: string[];
	};
	/**
	 * EditorNetwork is a packet sent from the server to the client and vise-versa to communicate editor-mode related
	 * information. It carries a single compound tag containing the relevant information.
	 */
	export type packet_editor_network = {
		route_to_manager: boolean;
		/** Payload is a network little endian compound tag holding data relevant to the editor. */
		payload: any;
	};
	/**
	 * FeatureRegistry is a packet used to notify the client about the world generation features the server is currently
	 * using. This is used in combination with the client-side world generation system introduced in v1.19.20, allowing the
	 * client to completely generate the chunks of the world without having to rely on the server.
	 */
	export type packet_feature_registry = {
		/** Features is a slice of all registered world generation features. */
		features: {
			name: string;
			options: string;
		}[];
	};
	/**
	 * ServerStats is a packet sent from the server to the client to update the client on server statistics. It is purely
	 * used for telemetry.
	 */
	export type packet_server_stats = {
		server_time: number;
		network_time: number;
	};
	export type packet_request_network_settings = {
		client_protocol: number;
	};
	export type packet_game_test_request = {
		/** MaxTestsPerBatch ... */
		max_tests_per_batch: number;
		/** Repetitions represents the amount of times the test will be run. */
		repetitions: number;
		/** Rotation represents the rotation of the test. It is one of the constants above. */
		rotation: "0deg" | "90deg" | "180deg" | "270deg" | "360deg";
		stop_on_error: boolean;
		position: BlockCoordinates;
		tests_per_row: number;
		name: string;
	};
	export type packet_game_test_results = {
		succeeded: boolean;
		error: string;
		name: string;
	};
	export type InputLockFlags = {
		move?: boolean;
		jump?: boolean;
		sneak?: boolean;
		mount?: boolean;
		dismount?: boolean;
		rotation?: boolean;
	};
	export type packet_update_client_input_locks = {
		locks: InputLockFlags;
		position: vec3f;
	};
	export type packet_client_cheat_ability = {
		entity_unique_id: bigint;
		permission_level: PermissionLevel;
		command_permission: CommandPermissionLevel;
		abilities: AbilityLayers[];
	};
	export type packet_camera_presets = {
		presets: CameraPresets[];
	};
	export type packet_unlocked_recipes = {
		unlock_type: "empty" | "initially_unlocked" | "newly_unlocked" | "remove_unlocked" | "remove_all_unlocked";
		recipes: string[];
	};
	export type packet_camera_instruction = {
		instruction_set?: {
			runtime_id: number;
			ease_data?: {
				type: EaseType;
				duration: number;
			};
			position?: vec3f;
			rotation?: vec2f;
			facing?: vec3f;
			offset?: vec2f;
			entity_offset?: vec3f;
			default?: boolean;
			remove_ignore_starting_values: boolean;
		};
		clear?: boolean;
		fade?: {
			fade_in_duration: number;
			wait_duration: number;
			fade_out_duration: number;
			color_rgb: vec3f;
		};
		target?: {
			offset?: vec3f;
			entity_unique_id: bigint;
		};
		remove_target?: boolean;
		fov?: {
			field_of_view: number;
			ease_time: number;
			ease_type: EaseType;
			clear: boolean;
		};
		spline?: CameraSplineInstruction;
		attach_to_entity?: bigint;
		detach_from_entity?: boolean;
	};
	export type packet_compressed_biome_definitions = {
		raw_payload: ByteArray;
	};
	export type packet_trim_data = {
		patterns: {
			item_name: string;
			pattern: string;
		}[];
		materials: {
			material: string;
			color: string;
			item_name: string;
		}[];
	};
	export type packet_open_sign = {
		position: BlockCoordinates;
		is_front: boolean;
	};
	/**
	 * agent_animation is an Education Edition packet sent from the server to the client to make an agent perform an animation.
	 */
	export type packet_agent_animation = {
		/** animation is the ID of the animation that the agent should perform. As of its implementation, there are no IDs that can be used in the regular client. */
		animation: "arm_swing" | "shrug";
		/** entity_runtime_id is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		entity_runtime_id: bigint;
	};
	/**
	 * RefreshEntitlements is sent by the client to the server to refresh the entitlements of the player.
	 */
	export type packet_refresh_entitlements = {
		
	};
	export type packet_toggle_crafter_slot_request = {
		position: vec3li;
		slot: number;
		disabled: boolean;
	};
	export type packet_set_player_inventory_options = {
		left_tab: "none" | "construction" | "equipment" | "items" | "nature" | "search" | "survival";
		right_tab: "none" | "fullscreen" | "crafting" | "armor";
		filtering: boolean;
		layout: "none" | "survival" | "recipe_book" | "creative";
		crafting_layout: "none" | "survival" | "recipe_book" | "creative";
	};
	export type packet_set_hud = {
		elements: Element[];
		visibility: "hide" | "reset";
	};
	export type Element = "PaperDoll" | "Armour" | "ToolTips" | "TouchControls" | "Crosshair" | "HotBar" | "Health" | "ProgressBar" | "Hunger" | "AirBubbles" | "VehicleHealth" | "EffectsBar" | "ItemTextPopup";
	export type packet_award_achievement = {
		achievement_id: number;
	};
	export type packet_server_post_move = {
		position: vec3f;
	};
	/**
	 * clientbound_close_form is sent by the server to clear the entire form stack of the client. This means that all
	 * forms that are currently open will be closed. This does not affect inventories and other containers.
	 */
	export type packet_clientbound_close_form = {
		
	};
	export type packet_serverbound_loading_screen = {
		type: number;
		loading_screen_id?: number;
	};
	export type packet_jigsaw_structure_data = {
		structure_data: any;
	};
	export type packet_current_structure_feature = {
		current_feature: string;
	};
	export type packet_serverbound_diagnostics = {
		average_frames_per_second: number;
		average_server_sim_tick_time: number;
		average_client_sim_tick_time: number;
		average_begin_frame_time: number;
		average_input_time: number;
		average_render_time: number;
		average_end_frame_time: number;
		average_remainder_time_percent: number;
		average_unaccounted_time_percent: number;
	};
	export type packet_camera_aim_assist = {
		preset_id: string;
		view_angle: vec2f;
		distance: number;
		target_mode: "angle" | "distance";
		action: "set" | "clear";
		show_debug_render: boolean;
	};
	export type packet_container_registry_cleanup = {
		removed_containers: FullContainerName[];
	};
	export type packet_movement_effect = {
		runtime_id: bigint;
		effect_type: MovementEffectType;
		effect_duration: number;
		tick: bigint;
	};
	export type packet_set_movement_authority = {
		movement_authority: "client" | "server" | "server_with_rewind";
	};
	/**
	 * CameraAimAssistPresets is sent by the server to the client to provide a list of categories and presets
	 * that can be used when sending a CameraAimAssist packet or a CameraInstruction including aim assist.
	 */
	export type packet_camera_aim_assist_presets = {
		/** CategoryGroups is a list of groups of categories which can be referenced by one of the Presets. */
		categories: {
			/** Identifier is the unique identifier of the group. */
			name: string;
			/** Priorities represents the block and entity specific priorities for targetting. The aim assist will select the block or entity with the highest priority within the specified thresholds. */
			entity_priorities: {
				id: string;
				priority: number;
			}[];
			block_priorities: {
				id: string;
				priority: number;
			}[];
			block_tags: number[];
			entity_default?: number;
			block_default?: number;
		}[];
		presets: {
			id: string;
			exclusion_settings: {
				blocks: string[];
				entities: string[];
				block_tags: string[];
			};
			target_liquids: string[];
			item_settings: {
				/** Identifier of the item to apply the settings to. */
				id: string;
				/** Category is the identifier of a category to use which has been defined by a CameraAimAssistCategory. */
				category: string;
			}[];
			default_item_settings?: string;
			hand_settings?: string;
		}[];
		operation: "set" | "add_to_existing";
	};
	export type packet_client_camera_aim_assist = {
		/** !bound: client */
		preset_id: string;
		action: "set_from_camera_preset" | "clear";
		allow_aim_assist: boolean;
	};
	export type packet_client_movement_prediction_sync = {
		/** !bound: ? */
		data_flags: number;
		bounding_box: {
			scale: number;
			width: number;
			height: number;
		};
		movement_speed: number;
		underwater_movement_speed: number;
		lava_movement_speed: number;
		jump_strength: number;
		health: number;
		hunger: number;
		entity_runtime_id: bigint;
		is_flying: boolean;
	};
	export type packet_update_client_options = {
		graphics_mode?: "simple" | "fancy" | "advanced" | "ray_traced";
	};
	/**
	 * PlayerVideoCapturePacket is sent by the server to start or stop video recording for a player. This packet
	 * only works on development builds and has no effect on retail builds. When recording, the client will save
	 * individual frames to '/LocalCache/minecraftpe' in the format specified below.
	 */
	export type packet_player_video_capture = {
		/** action is the action that the client should perform. This is one of the constants defined above. */
		action: "stop" | "start";
		frame_rate?: number;
		file_prefix?: string;
	};
	/**
	 * PlayerUpdateEntityOverrides is sent by the server to modify an entity's properties individually.
	 */
	export type packet_player_update_entity_overrides = {
		/** EntityRuntimeID is the runtime ID of the entity. The runtime ID is unique for each world session, and entities are generally identified in packets using this runtime ID. */
		runtime_id: bigint;
		/** PropertyIndex is the index of the property to modify. The index is unique for each property of an entity. */
		property_index: number;
		/** Type is the type of action to perform with the property. It is one of the constants above. */
		type: "clear_all" | "remove" | "set_int" | "set_float";
		value?: number;
	};
	export type packet_player_location = {
		/** Type is the action that is being performed. It is one of the constants above. */
		type: "coordinates" | "type_hide";
		entity_unique_id: bigint;
		position?: vec3f;
	};
	export type packet_clientbound_controls_scheme = {
		/** Scheme is the scheme that the client should use. It is one of the constants above. */
		scheme: "locked_player_relative_strafe" | "camera_relative" | "camera_relative_strafe" | "player_relative" | "player_relative_strafe";
	};
	/**
	 * ServerScriptDebugDrawer instructs the client to render debug shapes for development visualisations.
	 */
	export type packet_server_script_debug_drawer = {
		shapes: {
			network_id: bigint;
			shape_type?: "line" | "box" | "sphere" | "circle" | "text" | "arrow";
			location?: vec3f;
			scale?: number;
			rotation?: vec3f;
			time_left?: number;
			color?: number;
			text?: string;
			box_bound?: vec3f;
			line_end_location?: vec3f;
			arrow_head_length?: number;
			arrow_head_radius?: number;
			segment_count?: number;
		}[];
	};
	/**
	 * ServerBoundPackSettingChange
	 */
	export type packet_serverbound_pack_setting_change = {
		pack_id: string;
		pack_setting: {
			name: string;
			type: "float" | "bool" | "string";
			value: number | boolean | string;
		};
	};
	export type packet_clientbound_data_store = {
		entries: {
			type: "update" | "change" | "removal";
			name?: string;
			property?: string;
			path?: string;
			data_type?: "double" | "bool" | "string";
			data?: number | boolean | string;
			update_count?: number;
		}[];
	};
	export type packet_graphics_override_parameter = {
		values: ParameterKeyframeValue[];
		biome_identifier: string;
		parameter_type: GraphicsOverrideParameterType;
		reset: boolean;
	};
	export type packet_serverbound_data_store = {
		name: string;
		property: string;
		path: string;
		data_type: "double" | "bool" | "string";
		data: number | boolean | string;
		update_count: number;
	};
	/**
	 * Maps packet event names to their corresponding packet types.
	 * Used for typed event handlers on the Bedrock client.
	 */
	export type BedrockPacketEventMap = {
		login: (packet: packet_login)=> void;
		play_status: (packet: packet_play_status)=> void;
		server_to_client_handshake: (packet: packet_server_to_client_handshake)=> void;
		client_to_server_handshake: (packet: packet_client_to_server_handshake)=> void;
		disconnect: (packet: packet_disconnect)=> void;
		resource_packs_info: (packet: packet_resource_packs_info)=> void;
		resource_pack_stack: (packet: packet_resource_pack_stack)=> void;
		resource_pack_client_response: (packet: packet_resource_pack_client_response)=> void;
		text: (packet: packet_text)=> void;
		set_time: (packet: packet_set_time)=> void;
		start_game: (packet: packet_start_game)=> void;
		add_player: (packet: packet_add_player)=> void;
		add_entity: (packet: packet_add_entity)=> void;
		remove_entity: (packet: packet_remove_entity)=> void;
		add_item_entity: (packet: packet_add_item_entity)=> void;
		server_post_move: (packet: packet_server_post_move)=> void;
		take_item_entity: (packet: packet_take_item_entity)=> void;
		move_entity: (packet: packet_move_entity)=> void;
		move_player: (packet: packet_move_player)=> void;
		rider_jump: (packet: packet_rider_jump)=> void;
		update_block: (packet: packet_update_block)=> void;
		add_painting: (packet: packet_add_painting)=> void;
		tick_sync: (packet: packet_tick_sync)=> void;
		level_sound_event_old: (packet: packet_level_sound_event_old)=> void;
		level_event: (packet: packet_level_event)=> void;
		block_event: (packet: packet_block_event)=> void;
		entity_event: (packet: packet_entity_event)=> void;
		mob_effect: (packet: packet_mob_effect)=> void;
		update_attributes: (packet: packet_update_attributes)=> void;
		inventory_transaction: (packet: packet_inventory_transaction)=> void;
		mob_equipment: (packet: packet_mob_equipment)=> void;
		mob_armor_equipment: (packet: packet_mob_armor_equipment)=> void;
		interact: (packet: packet_interact)=> void;
		block_pick_request: (packet: packet_block_pick_request)=> void;
		entity_pick_request: (packet: packet_entity_pick_request)=> void;
		player_action: (packet: packet_player_action)=> void;
		hurt_armor: (packet: packet_hurt_armor)=> void;
		set_entity_data: (packet: packet_set_entity_data)=> void;
		set_entity_motion: (packet: packet_set_entity_motion)=> void;
		set_entity_link: (packet: packet_set_entity_link)=> void;
		set_health: (packet: packet_set_health)=> void;
		set_spawn_position: (packet: packet_set_spawn_position)=> void;
		animate: (packet: packet_animate)=> void;
		respawn: (packet: packet_respawn)=> void;
		container_open: (packet: packet_container_open)=> void;
		container_close: (packet: packet_container_close)=> void;
		player_hotbar: (packet: packet_player_hotbar)=> void;
		inventory_content: (packet: packet_inventory_content)=> void;
		inventory_slot: (packet: packet_inventory_slot)=> void;
		container_set_data: (packet: packet_container_set_data)=> void;
		crafting_data: (packet: packet_crafting_data)=> void;
		crafting_event: (packet: packet_crafting_event)=> void;
		gui_data_pick_item: (packet: packet_gui_data_pick_item)=> void;
		adventure_settings: (packet: packet_adventure_settings)=> void;
		block_entity_data: (packet: packet_block_entity_data)=> void;
		player_input: (packet: packet_player_input)=> void;
		level_chunk: (packet: packet_level_chunk)=> void;
		set_commands_enabled: (packet: packet_set_commands_enabled)=> void;
		set_difficulty: (packet: packet_set_difficulty)=> void;
		change_dimension: (packet: packet_change_dimension)=> void;
		set_player_game_type: (packet: packet_set_player_game_type)=> void;
		player_list: (packet: packet_player_list)=> void;
		simple_event: (packet: packet_simple_event)=> void;
		event: (packet: packet_event)=> void;
		spawn_experience_orb: (packet: packet_spawn_experience_orb)=> void;
		clientbound_map_item_data: (packet: packet_clientbound_map_item_data)=> void;
		map_info_request: (packet: packet_map_info_request)=> void;
		request_chunk_radius: (packet: packet_request_chunk_radius)=> void;
		chunk_radius_update: (packet: packet_chunk_radius_update)=> void;
		game_rules_changed: (packet: packet_game_rules_changed)=> void;
		camera: (packet: packet_camera)=> void;
		boss_event: (packet: packet_boss_event)=> void;
		show_credits: (packet: packet_show_credits)=> void;
		available_commands: (packet: packet_available_commands)=> void;
		command_request: (packet: packet_command_request)=> void;
		command_block_update: (packet: packet_command_block_update)=> void;
		command_output: (packet: packet_command_output)=> void;
		update_trade: (packet: packet_update_trade)=> void;
		update_equipment: (packet: packet_update_equipment)=> void;
		resource_pack_data_info: (packet: packet_resource_pack_data_info)=> void;
		resource_pack_chunk_data: (packet: packet_resource_pack_chunk_data)=> void;
		resource_pack_chunk_request: (packet: packet_resource_pack_chunk_request)=> void;
		transfer: (packet: packet_transfer)=> void;
		play_sound: (packet: packet_play_sound)=> void;
		stop_sound: (packet: packet_stop_sound)=> void;
		set_title: (packet: packet_set_title)=> void;
		add_behavior_tree: (packet: packet_add_behavior_tree)=> void;
		structure_block_update: (packet: packet_structure_block_update)=> void;
		show_store_offer: (packet: packet_show_store_offer)=> void;
		purchase_receipt: (packet: packet_purchase_receipt)=> void;
		player_skin: (packet: packet_player_skin)=> void;
		sub_client_login: (packet: packet_sub_client_login)=> void;
		initiate_web_socket_connection: (packet: packet_initiate_web_socket_connection)=> void;
		set_last_hurt_by: (packet: packet_set_last_hurt_by)=> void;
		book_edit: (packet: packet_book_edit)=> void;
		npc_request: (packet: packet_npc_request)=> void;
		photo_transfer: (packet: packet_photo_transfer)=> void;
		modal_form_request: (packet: packet_modal_form_request)=> void;
		modal_form_response: (packet: packet_modal_form_response)=> void;
		server_settings_request: (packet: packet_server_settings_request)=> void;
		server_settings_response: (packet: packet_server_settings_response)=> void;
		show_profile: (packet: packet_show_profile)=> void;
		set_default_game_type: (packet: packet_set_default_game_type)=> void;
		remove_objective: (packet: packet_remove_objective)=> void;
		set_display_objective: (packet: packet_set_display_objective)=> void;
		set_score: (packet: packet_set_score)=> void;
		lab_table: (packet: packet_lab_table)=> void;
		update_block_synced: (packet: packet_update_block_synced)=> void;
		move_entity_delta: (packet: packet_move_entity_delta)=> void;
		set_scoreboard_identity: (packet: packet_set_scoreboard_identity)=> void;
		set_local_player_as_initialized: (packet: packet_set_local_player_as_initialized)=> void;
		update_soft_enum: (packet: packet_update_soft_enum)=> void;
		network_stack_latency: (packet: packet_network_stack_latency)=> void;
		script_custom_event: (packet: packet_script_custom_event)=> void;
		spawn_particle_effect: (packet: packet_spawn_particle_effect)=> void;
		available_entity_identifiers: (packet: packet_available_entity_identifiers)=> void;
		level_sound_event_v2: (packet: packet_level_sound_event_v2)=> void;
		network_chunk_publisher_update: (packet: packet_network_chunk_publisher_update)=> void;
		biome_definition_list: (packet: packet_biome_definition_list)=> void;
		level_sound_event: (packet: packet_level_sound_event)=> void;
		level_event_generic: (packet: packet_level_event_generic)=> void;
		lectern_update: (packet: packet_lectern_update)=> void;
		video_stream_connect: (packet: packet_video_stream_connect)=> void;
		client_cache_status: (packet: packet_client_cache_status)=> void;
		on_screen_texture_animation: (packet: packet_on_screen_texture_animation)=> void;
		map_create_locked_copy: (packet: packet_map_create_locked_copy)=> void;
		structure_template_data_export_request: (packet: packet_structure_template_data_export_request)=> void;
		structure_template_data_export_response: (packet: packet_structure_template_data_export_response)=> void;
		update_block_properties: (packet: packet_update_block_properties)=> void;
		client_cache_blob_status: (packet: packet_client_cache_blob_status)=> void;
		client_cache_miss_response: (packet: packet_client_cache_miss_response)=> void;
		education_settings: (packet: packet_education_settings)=> void;
		emote: (packet: packet_emote)=> void;
		multiplayer_settings: (packet: packet_multiplayer_settings)=> void;
		settings_command: (packet: packet_settings_command)=> void;
		anvil_damage: (packet: packet_anvil_damage)=> void;
		completed_using_item: (packet: packet_completed_using_item)=> void;
		network_settings: (packet: packet_network_settings)=> void;
		player_auth_input: (packet: packet_player_auth_input)=> void;
		creative_content: (packet: packet_creative_content)=> void;
		player_enchant_options: (packet: packet_player_enchant_options)=> void;
		item_stack_request: (packet: packet_item_stack_request)=> void;
		item_stack_response: (packet: packet_item_stack_response)=> void;
		player_armor_damage: (packet: packet_player_armor_damage)=> void;
		code_builder: (packet: packet_code_builder)=> void;
		update_player_game_type: (packet: packet_update_player_game_type)=> void;
		emote_list: (packet: packet_emote_list)=> void;
		position_tracking_db_broadcast: (packet: packet_position_tracking_db_broadcast)=> void;
		position_tracking_db_request: (packet: packet_position_tracking_db_request)=> void;
		debug_info: (packet: packet_debug_info)=> void;
		packet_violation_warning: (packet: packet_packet_violation_warning)=> void;
		motion_prediction_hints: (packet: packet_motion_prediction_hints)=> void;
		animate_entity: (packet: packet_animate_entity)=> void;
		camera_shake: (packet: packet_camera_shake)=> void;
		player_fog: (packet: packet_player_fog)=> void;
		correct_player_move_prediction: (packet: packet_correct_player_move_prediction)=> void;
		item_registry: (packet: packet_item_registry)=> void;
		filter_text_packet: (packet: packet_filter_text_packet)=> void;
		debug_renderer: (packet: packet_debug_renderer)=> void;
		sync_entity_property: (packet: packet_sync_entity_property)=> void;
		add_volume_entity: (packet: packet_add_volume_entity)=> void;
		remove_volume_entity: (packet: packet_remove_volume_entity)=> void;
		simulation_type: (packet: packet_simulation_type)=> void;
		npc_dialogue: (packet: packet_npc_dialogue)=> void;
		edu_uri_resource_packet: (packet: packet_edu_uri_resource_packet)=> void;
		create_photo: (packet: packet_create_photo)=> void;
		update_subchunk_blocks: (packet: packet_update_subchunk_blocks)=> void;
		photo_info_request: (packet: packet_photo_info_request)=> void;
		subchunk: (packet: packet_subchunk)=> void;
		subchunk_request: (packet: packet_subchunk_request)=> void;
		client_start_item_cooldown: (packet: packet_client_start_item_cooldown)=> void;
		script_message: (packet: packet_script_message)=> void;
		code_builder_source: (packet: packet_code_builder_source)=> void;
		ticking_areas_load_status: (packet: packet_ticking_areas_load_status)=> void;
		dimension_data: (packet: packet_dimension_data)=> void;
		agent_action: (packet: packet_agent_action)=> void;
		change_mob_property: (packet: packet_change_mob_property)=> void;
		lesson_progress: (packet: packet_lesson_progress)=> void;
		request_ability: (packet: packet_request_ability)=> void;
		request_permissions: (packet: packet_request_permissions)=> void;
		toast_request: (packet: packet_toast_request)=> void;
		update_abilities: (packet: packet_update_abilities)=> void;
		update_adventure_settings: (packet: packet_update_adventure_settings)=> void;
		death_info: (packet: packet_death_info)=> void;
		editor_network: (packet: packet_editor_network)=> void;
		feature_registry: (packet: packet_feature_registry)=> void;
		server_stats: (packet: packet_server_stats)=> void;
		request_network_settings: (packet: packet_request_network_settings)=> void;
		game_test_request: (packet: packet_game_test_request)=> void;
		game_test_results: (packet: packet_game_test_results)=> void;
		update_client_input_locks: (packet: packet_update_client_input_locks)=> void;
		client_cheat_ability: (packet: packet_client_cheat_ability)=> void;
		camera_presets: (packet: packet_camera_presets)=> void;
		unlocked_recipes: (packet: packet_unlocked_recipes)=> void;
		camera_instruction: (packet: packet_camera_instruction)=> void;
		compressed_biome_definitions: (packet: packet_compressed_biome_definitions)=> void;
		trim_data: (packet: packet_trim_data)=> void;
		open_sign: (packet: packet_open_sign)=> void;
		agent_animation: (packet: packet_agent_animation)=> void;
		refresh_entitlements: (packet: packet_refresh_entitlements)=> void;
		toggle_crafter_slot_request: (packet: packet_toggle_crafter_slot_request)=> void;
		set_player_inventory_options: (packet: packet_set_player_inventory_options)=> void;
		set_hud: (packet: packet_set_hud)=> void;
		award_achievement: (packet: packet_award_achievement)=> void;
		clientbound_close_form: (packet: packet_clientbound_close_form)=> void;
		serverbound_loading_screen: (packet: packet_serverbound_loading_screen)=> void;
		jigsaw_structure_data: (packet: packet_jigsaw_structure_data)=> void;
		current_structure_feature: (packet: packet_current_structure_feature)=> void;
		serverbound_diagnostics: (packet: packet_serverbound_diagnostics)=> void;
		camera_aim_assist: (packet: packet_camera_aim_assist)=> void;
		container_registry_cleanup: (packet: packet_container_registry_cleanup)=> void;
		movement_effect: (packet: packet_movement_effect)=> void;
		set_movement_authority: (packet: packet_set_movement_authority)=> void;
		camera_aim_assist_presets: (packet: packet_camera_aim_assist_presets)=> void;
		client_camera_aim_assist: (packet: packet_client_camera_aim_assist)=> void;
		client_movement_prediction_sync: (packet: packet_client_movement_prediction_sync)=> void;
		update_client_options: (packet: packet_update_client_options)=> void;
		player_video_capture: (packet: packet_player_video_capture)=> void;
		player_update_entity_overrides: (packet: packet_player_update_entity_overrides)=> void;
		player_location: (packet: packet_player_location)=> void;
		clientbound_controls_scheme: (packet: packet_clientbound_controls_scheme)=> void;
		server_script_debug_drawer: (packet: packet_server_script_debug_drawer)=> void;
		serverbound_pack_setting_change: (packet: packet_serverbound_pack_setting_change)=> void;
		clientbound_data_store: (packet: packet_clientbound_data_store)=> void;
		graphics_override_parameter: (packet: packet_graphics_override_parameter)=> void;
		serverbound_data_store: (packet: packet_serverbound_data_store)=> void;
	};
}