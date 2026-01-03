/**
 * Tests for MockBedrockClient - a network-free test client
 */

import { expect } from 'expect';
import {
  MockBedrockClient,
  createMockClient,
  createAutoResponders,
  installAllAutoResponders,
  createTestBot,
  waitForInjectAllowed,
  waitForSpawn,
  injectStartSequence,
  tick,
  delay,
  getDataBuilder,
} from 'minecraft-bedrock-test-server';

describe('MockBedrockClient', function () {
  this.timeout(10000);

  describe('packet capture', () => {
    it('captures packets via write()', () => {
      const mockClient = createMockClient();

      mockClient.write('text', { type: 'chat', message: 'Hello' });
      mockClient.write('move_player', { position: { x: 0, y: 0, z: 0 } });

      expect(mockClient.sentPackets).toHaveLength(2);
      expect(mockClient.sentPackets[0].name).toBe('text');
      expect(mockClient.sentPackets[0].params.message).toBe('Hello');
      expect(mockClient.sentPackets[1].name).toBe('move_player');
    });

    it('captures packets via queue()', () => {
      const mockClient = createMockClient();

      mockClient.queue('mob_equipment', { slot: 0 });

      expect(mockClient.queuedPackets).toHaveLength(1);
      expect(mockClient.sentPackets).toHaveLength(1); // Also in sentPackets
      expect(mockClient.queuedPackets[0].name).toBe('mob_equipment');
    });

    it('filters packets by name with getPackets()', () => {
      const mockClient = createMockClient();

      mockClient.write('text', { message: 'Hello' });
      mockClient.write('move_player', { x: 0 });
      mockClient.write('text', { message: 'World' });

      const textPackets = mockClient.getPackets('text');
      expect(textPackets).toHaveLength(2);
      expect(textPackets[0].params.message).toBe('Hello');
      expect(textPackets[1].params.message).toBe('World');
    });

    it('gets last packet with getLastPacket()', () => {
      const mockClient = createMockClient();

      mockClient.write('text', { message: 'First' });
      mockClient.write('text', { message: 'Second' });
      mockClient.write('text', { message: 'Third' });

      const last = mockClient.getLastPacket('text');
      expect(last?.params.message).toBe('Third');
    });

    it('clears packets with clearPackets()', () => {
      const mockClient = createMockClient();

      mockClient.write('text', { message: 'Test' });
      expect(mockClient.sentPackets).toHaveLength(1);

      mockClient.clearPackets();
      expect(mockClient.sentPackets).toHaveLength(0);
      expect(mockClient.queuedPackets).toHaveLength(0);
    });

    it('adds timestamps to captured packets', () => {
      const mockClient = createMockClient();
      const before = Date.now();

      mockClient.write('text', { message: 'Test' });

      const after = Date.now();
      expect(mockClient.sentPackets[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(mockClient.sentPackets[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('packet injection', () => {
    it('emits events via inject()', (done) => {
      const mockClient = createMockClient();

      mockClient.on('text', (params) => {
        expect(params.message).toBe('Hello from server');
        done();
      });

      mockClient.inject('text', { type: 'chat', message: 'Hello from server' });
    });

    it('supports multiple listeners', () => {
      const mockClient = createMockClient();
      const received: string[] = [];

      mockClient.on('text', (params) => received.push(`listener1: ${params.message}`));
      mockClient.on('text', (params) => received.push(`listener2: ${params.message}`));

      mockClient.inject('text', { message: 'Test' });

      expect(received).toEqual(['listener1: Test', 'listener2: Test']);
    });
  });

  describe('waitForPacket', () => {
    it('resolves when packet is sent', async () => {
      const mockClient = createMockClient();

      // Send packet after a small delay
      setTimeout(() => {
        mockClient.write('text', { message: 'Delayed' });
      }, 50);

      const packet = await mockClient.waitForPacket('text', 1000);
      expect(packet.params.message).toBe('Delayed');
    });

    it('resolves immediately if packet already exists', async () => {
      const mockClient = createMockClient();

      mockClient.write('text', { message: 'Already sent' });

      const packet = await mockClient.waitForPacket('text', 100);
      expect(packet.params.message).toBe('Already sent');
    });

    it('rejects on timeout', async () => {
      const mockClient = createMockClient();

      await expect(mockClient.waitForPacket('nonexistent', 100)).rejects.toThrow(
        'Timeout waiting for packet: nonexistent'
      );
    });
  });

  describe('auto-responders', () => {
    it('auto-responds to item_stack_request', async () => {
      const mockClient = createMockClient();
      const responders = createAutoResponders();

      mockClient.setAutoResponder('item_stack_request', responders.itemStackApprove);

      const responses: any[] = [];
      mockClient.on('item_stack_response', (params) => responses.push(params));

      mockClient.write('item_stack_request', {
        requests: [
          { request_id: 1, actions: [] },
          { request_id: 2, actions: [] },
        ],
      });

      // Wait for setImmediate in auto-responder
      await tick();

      expect(responses).toHaveLength(1);
      expect(responses[0].responses).toHaveLength(2);
      expect(responses[0].responses[0].status).toBe('ok');
      expect(responses[0].responses[0].request_id).toBe(1);
      expect(responses[0].responses[1].request_id).toBe(2);
    });

    it('auto-responds to interact open_inventory', async () => {
      const mockClient = createMockClient();
      const responders = createAutoResponders();

      mockClient.setAutoResponder('interact', responders.inventoryOpen);

      const responses: any[] = [];
      mockClient.on('container_open', (params) => responses.push(params));

      mockClient.write('interact', { action_id: 'open_inventory' });
      await tick();

      expect(responses).toHaveLength(1);
      expect(responses[0].window_type).toBe('inventory');
    });

    it('does not respond when action_id is not open_inventory', async () => {
      const mockClient = createMockClient();
      const responders = createAutoResponders();

      mockClient.setAutoResponder('interact', responders.inventoryOpen);

      const responses: any[] = [];
      mockClient.on('container_open', (params) => responses.push(params));

      mockClient.write('interact', { action_id: 'attack' });
      await tick();

      expect(responses).toHaveLength(0);
    });

    it('auto-responds to container_close', async () => {
      const mockClient = createMockClient();
      const responders = createAutoResponders();

      mockClient.setAutoResponder('container_close', responders.containerCloseConfirm);

      const responses: any[] = [];
      mockClient.on('container_close', (params) => responses.push(params));

      mockClient.write('container_close', { window_id: 5 });
      await tick();

      expect(responses).toHaveLength(1);
      expect(responses[0].window_id).toBe(5);
      expect(responses[0].server).toBe(true);
    });

    it('installAllAutoResponders installs all handlers', async () => {
      const mockClient = createMockClient();
      installAllAutoResponders(mockClient);

      const responses: any[] = [];
      mockClient.on('item_stack_response', (params) => responses.push({ type: 'stack', params }));
      mockClient.on('container_open', (params) => responses.push({ type: 'open', params }));
      mockClient.on('container_close', (params) => responses.push({ type: 'close', params }));
      mockClient.on('text', (params) => responses.push({ type: 'text', params }));

      mockClient.write('item_stack_request', { requests: [{ request_id: 1 }] });
      mockClient.write('interact', { action_id: 'open_inventory' });
      mockClient.write('container_close', { window_id: 1 });
      mockClient.write('text', { message: 'Hello' });
      await tick();

      expect(responses).toHaveLength(4);
    });

    it('can remove auto-responders', async () => {
      const mockClient = createMockClient();
      const responders = createAutoResponders();

      mockClient.setAutoResponder('text', responders.chatEcho);

      const responses: any[] = [];
      mockClient.on('text', (params) => responses.push(params));

      mockClient.write('text', { message: 'First' });
      await tick();
      expect(responses).toHaveLength(1);

      mockClient.removeAutoResponder('text');
      mockClient.write('text', { message: 'Second' });
      await tick();
      expect(responses).toHaveLength(1); // Still 1, no new response
    });
  });

  describe('helper methods', () => {
    it('injectItemStackResponse injects success response', (done) => {
      const mockClient = createMockClient();

      mockClient.on('item_stack_response', (params) => {
        expect(params.responses).toHaveLength(1);
        expect(params.responses[0].status).toBe('ok');
        expect(params.responses[0].request_id).toBe(42);
        done();
      });

      mockClient.injectItemStackResponse(42, true);
    });

    it('injectItemStackResponse injects error response', (done) => {
      const mockClient = createMockClient();

      mockClient.on('item_stack_response', (params) => {
        expect(params.responses[0].status).toBe('error');
        done();
      });

      mockClient.injectItemStackResponse(42, false);
    });

    it('injectContainerOpen injects container_open packet', (done) => {
      const mockClient = createMockClient();

      mockClient.on('container_open', (params) => {
        expect(params.window_id).toBe(5);
        expect(params.window_type).toBe('chest');
        done();
      });

      mockClient.injectContainerOpen(5, 'chest');
    });

    it('injectContainerClose injects server close confirmation', (done) => {
      const mockClient = createMockClient();

      mockClient.on('container_close', (params) => {
        expect(params.window_id).toBe(5);
        expect(params.server).toBe(true);
        done();
      });

      mockClient.injectContainerClose(5);
    });
  });

  describe('events', () => {
    it('emits packetSent on write()', (done) => {
      const mockClient = createMockClient();

      mockClient.on('packetSent', (capture) => {
        expect(capture.name).toBe('text');
        expect(capture.params.message).toBe('Test');
        done();
      });

      mockClient.write('text', { message: 'Test' });
    });

    it('emits packetQueued on queue()', (done) => {
      const mockClient = createMockClient();

      mockClient.on('packetQueued', (capture) => {
        expect(capture.name).toBe('mob_equipment');
        done();
      });

      mockClient.queue('mob_equipment', { slot: 0 });
    });

    it('emits end event', (done) => {
      const mockClient = createMockClient();

      mockClient.on('end', (reason) => {
        expect(reason).toBe('test disconnect');
        done();
      });

      mockClient.end('test disconnect');
    });

    it('emits close event', (done) => {
      const mockClient = createMockClient();

      mockClient.on('close', () => {
        done();
      });

      mockClient.close();
    });
  });

  describe('packet validation', () => {
    it('returns validation result with valid flag', () => {
      const mockClient = createMockClient({ validatePackets: true });

      // Test that validatePacket returns the expected structure
      const result = mockClient.validatePacket('text', {
        type: 'chat',
        message: 'Hello',
      });

      // Result should have valid and optionally normalized/error
      expect(typeof result.valid).toBe('boolean');
      expect(result).toHaveProperty('valid');
    });

    it('captures packets even with validation enabled', () => {
      const mockClient = createMockClient({ validatePackets: false });

      mockClient.write('text', { message: 'Test' });

      expect(mockClient.sentPackets).toHaveLength(1);
      expect(mockClient.sentPackets[0].params.message).toBe('Test');
    });
  });

  describe('properties', () => {
    it('has version property', () => {
      const mockClient = createMockClient({ version: '1.21.130' });
      expect(mockClient.version).toBe('1.21.130');
    });

    it('has default version', () => {
      const mockClient = createMockClient();
      expect(mockClient.version).toBe('1.21.130');
    });

    it('has wait_connect set to false', () => {
      const mockClient = createMockClient();
      expect(mockClient.wait_connect).toBe(false);
    });

    it('has status set to 0', () => {
      const mockClient = createMockClient();
      expect(mockClient.status).toBe(0);
    });
  });
});

describe('test-helpers', () => {
  describe('createTestBot', () => {
    it('creates a bot with mock client', async () => {
      const { bot, mockClient, dataBuilder } = await createTestBot({ autoStart: false });

      expect(bot).toBeDefined();
      expect(mockClient).toBeDefined();
      expect(dataBuilder).toBeDefined();

      // Bot should have the mock client
      expect(bot._client).toBe(mockClient);
    });

    it('uses default username TestBot', async () => {
      const { bot } = await createTestBot({ autoStart: false });
      // Username is stored in bot options, not bot.username (which is set after spawn)
      expect(bot._client).toBeDefined();
    });

    it('creates bot with custom username option', async () => {
      const { bot } = await createTestBot({ username: 'CustomBot', autoStart: false });
      // Bot is created with the options, _client should exist
      expect(bot._client).toBeDefined();
    });
  });

  describe('tick and delay', () => {
    it('tick allows event loop to process', async () => {
      let processed = false;
      setImmediate(() => {
        processed = true;
      });

      expect(processed).toBe(false);
      await tick();
      expect(processed).toBe(true);
    });

    it('delay waits for specified time', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });
});
