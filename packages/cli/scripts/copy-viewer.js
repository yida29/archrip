#!/usr/bin/env node
/**
 * Copy viewer source into dist/viewer-template/ for CLI distribution.
 * Excludes node_modules, dist, and .tsbuildinfo files.
 */
import { cpSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const viewerSrc = resolve(__dirname, '..', '..', 'viewer');
const viewerDest = resolve(__dirname, '..', 'dist', 'viewer-template');

if (!existsSync(viewerSrc)) {
  console.error('Error: packages/viewer not found. Run from monorepo root.');
  process.exit(1);
}

cpSync(viewerSrc, viewerDest, {
  recursive: true,
  filter: (src) => {
    const name = src.split('/').pop();
    return name !== 'node_modules' && name !== 'dist' && !name?.endsWith('.tsbuildinfo');
  },
});

console.log('Copied viewer source to dist/viewer-template/');
