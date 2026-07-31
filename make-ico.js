import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const appDir  = __dirname;
const pngPath = join(appDir, 'chronos-icon.png');
const icoPath = join(appDir, 'chronos-icon.ico');

const pngBytes = readFileSync(pngPath);
const pngLen   = pngBytes.length;
const dataOffset = 22; // 6 (ICO header) + 16 (dir entry)

// ---- ICO header (6 bytes) ----
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = ICO
header.writeUInt16LE(1, 4); // image count = 1

// ---- Directory entry (16 bytes) ----
const dir = Buffer.alloc(16);
dir.writeUInt8(0,  0); // width  (0 = 256px)
dir.writeUInt8(0,  1); // height (0 = 256px)
dir.writeUInt8(0,  2); // color count
dir.writeUInt8(0,  3); // reserved
dir.writeUInt16LE(0,  4); // planes
dir.writeUInt16LE(32, 6); // bit count
dir.writeUInt32LE(pngLen,      8); // image data size
dir.writeUInt32LE(dataOffset, 12); // image data offset

const ico = Buffer.concat([header, dir, pngBytes]);
writeFileSync(icoPath, ico);
console.log('ICO written:', ico.length, 'bytes ->', icoPath);
