import { setupServer, getDataBuilder, initializeClient, startServer, waitForClientConnect } from 'mineflayer-bedrock-server';

const builder = getDataBuilder('1.21.130');
builder.setInventoryItem(0, 'netherite_sword', 1, 1001);
builder.setInventoryItem(1, 'netherite_chestplate', 1, 1002);
builder.setInventoryItem(2, 'netherite_leggings', 1, 1003);
builder.setInventoryItem(3, 'netherite_sword', 1, 1004);
builder.setInventoryItem(8, 'netherite_sword', 1, 1005);
builder.setInventoryItem(9, 'jungle_log', 64, 1006);

const server = await startServer('192.168.1.13', 19150, '1.21.130');
const client = await waitForClientConnect(server);

client.on('interact', (params) => {
  if (params.action_id === 'open_inventory') {
    client.write('container_open', builder.fromHex('2e02ff00010001'));
  }
});

client.on('container_close', (params) => {
  client.write('container_close', params);
});

client.on('item_stack_request', (params) => {
  console.log(JSON.stringify(params));
});

await initializeClient(client, builder.data);
console.log('ready');
