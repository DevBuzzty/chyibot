#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '../dist/cli/index.js');
const srcPath = join(__dirname, '../src/cli/index.ts');

if (fs.existsSync(distPath)) {
  // Use compiled JS if available
  const node = spawn('node', [distPath, ...process.argv.slice(2)], {
    stdio: 'inherit'
  });
  node.on('exit', (code) => process.exit(code || 0));
} else {
  // Fallback to ts-node for development
  const tsNode = spawn('node', [
    '--loader', 'ts-node/esm',
    '--no-warnings',
    srcPath,
    ...process.argv.slice(2)
  ], {
    stdio: 'inherit'
  });
  tsNode.on('exit', (code) => process.exit(code || 0));
}
