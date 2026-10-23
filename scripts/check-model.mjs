import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const modelPath = path.join(projectRoot, 'public', 'models', 'hand_landmarker.task');
const wasmDir = path.join(projectRoot, 'public', 'wasm');

console.log('🔍 Checking local MediaPipe assets in SignBridge...');

let hasError = false;

if (fs.existsSync(modelPath)) {
  const stats = fs.statSync(modelPath);
  console.log(`✅ Model found: ${path.relative(projectRoot, modelPath)} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  if (stats.size < 1000000) {
    console.error('❌ Model file is suspiciously small or corrupted.');
    hasError = true;
  }
} else {
  console.error(`❌ Missing model file at ${modelPath}`);
  hasError = true;
}

if (fs.existsSync(wasmDir)) {
  const wasmFiles = fs.readdirSync(wasmDir).filter(f => f.endsWith('.wasm'));
  console.log(`✅ Local WASM binaries found (${wasmFiles.length} files): ${wasmFiles.join(', ')}`);
  if (wasmFiles.length === 0) {
    console.error('❌ No WASM files found in public/wasm');
    hasError = true;
  }
} else {
  console.error(`❌ Missing WASM directory at ${wasmDir}`);
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✨ All MediaPipe local assets verified! SignBridge will run 100% offline without CDN reliance.\n');
  process.exit(0);
}
