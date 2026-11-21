import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const inputPath = resolve(dirname(fileURLToPath(import.meta.url)), "poster", "poster.png");
const inputName = "poster/poster.png";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = resolve(outputDir, "entry.png");

let png: Buffer;
try {
  png = await readFile(inputPath);
} catch (error) {
  const detail = error instanceof Error && "code" in error && error.code === "ENOENT"
    ? "file is missing"
    : `could not be read (${error instanceof Error ? error.message : String(error)})`;
  throw new Error(`${inputName}: ${detail}`);
}

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (png.length < 24 || !png.subarray(0, 8).equals(signature)) {
  throw new Error(`${inputName}: invalid or truncated PNG signature/header`);
}
if (png.toString("ascii", 12, 16) !== "IHDR") {
  throw new Error(`${inputName}: PNG header is missing the IHDR chunk`);
}
if (png.length > 1_048_576) {
  throw new Error(`${inputName}: file is ${png.length} bytes; maximum is 1,048,576 bytes`);
}

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`${inputName}: dimensions are ${width}x${height}; expected 1024x1024`);
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, png);
console.log(`${png.length} bytes; ${width}x${height}`);
