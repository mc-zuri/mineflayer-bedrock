import { readFileSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = readFileSync(path.resolve(__dirname, 'creative_content.bin'));
export function creative_content(deserializer) {
  return deserializer.parsePacketBuffer(data).data.params;
}
