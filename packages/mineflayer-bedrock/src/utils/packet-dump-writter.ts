import * as fs from 'fs';
import { BinaryWriter, File, type IFile } from 'csbinary';

export class PackentDumpWriter {
  private filename: string;
  private file: IFile;
  private writer: BinaryWriter;
  private startTime = process.hrtime.bigint();

  /**
   * @param basePath - Base path without extension, e.g., "logs/1.21.130-1735833600000"
   * @param version - Protocol version to write in file header
   */
  constructor(basePath: string, version: string) {
    // Ensure output directory exists
    const dir = basePath.substring(0, basePath.lastIndexOf('/'));
    if (dir) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.filename = `${basePath}.bin`;
    this.file = File(fs.openSync(this.filename, 'w'));
    this.writer = new BinaryWriter(this.file);
    this.writer.writeString(version);
  }

  writeServerbound(buffer: Buffer) {
    const time = process.hrtime.bigint() - this.startTime;
    this.writer.writeChar('S');
    this.writer.writeInt64(time);
    this.writer.writeInt32(buffer.length);
    this.writer.writeBuffer(buffer);
    this.writer.flush();
  }

  writeClientbound(buffer: Buffer) {
    const time = process.hrtime.bigint() - this.startTime;
    this.writer.writeChar('C');
    this.writer.writeInt64(time);
    this.writer.writeInt32(buffer.length);
    this.writer.writeBuffer(buffer);
    this.writer.flush();
  }

  flush() {
    this.writer.flush();
  }

  close() {
    this.writer.flush();
    this.file.close();
    this.writer.close();
  }
}
