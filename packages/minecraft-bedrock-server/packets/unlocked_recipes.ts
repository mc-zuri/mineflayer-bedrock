import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, 'unlocked_recipes.bin'));
export function unlocked_recipes(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
