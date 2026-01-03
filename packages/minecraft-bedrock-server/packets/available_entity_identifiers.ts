import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, 'available_entity_identifiers.bin'));
export function available_entity_identifiers(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
