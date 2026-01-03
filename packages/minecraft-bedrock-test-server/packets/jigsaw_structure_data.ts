import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, 'jigsaw_structure_data.bin'));
export function jigsaw_structure_data(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
