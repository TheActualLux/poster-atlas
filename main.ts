import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const inputPath = resolve("poster/poster.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = resolve(outputDir, "entry.png");

const png = await readFile(inputPath);
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (png.length < 24 || !png.subarray(0, 8).equals(signature) || png.toString("ascii", 12, 16) !== "IHDR") {
  throw new Error("poster/poster.png is not a valid PNG with an IHDR header");
}
if (png.length > 1_048_576) {
  throw new Error(`PNG is too large: ${png.length} bytes (maximum 1,048,576)`);
}

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`PNG must be 1024x1024; got ${width}x${height}`);
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, png);
console.log(`${png.length} bytes; ${width}x${height}`);
