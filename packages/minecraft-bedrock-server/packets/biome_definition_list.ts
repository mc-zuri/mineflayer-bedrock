import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, 'biome_definition_list.bin'));
export function biome_definition_list(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
