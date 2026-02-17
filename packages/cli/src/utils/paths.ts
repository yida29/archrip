import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPackageRoot(): string {
  // In dist: dist/utils/paths.js → go up to package root
  // In src: src/utils/paths.ts → go up to package root
  return resolve(__dirname, '..', '..');
}

export function getTemplatesDir(): string {
  const pkgRoot = getPackageRoot();
  // Check dist first (published), then src (development)
  const distTemplates = join(pkgRoot, 'templates');
  if (existsSync(distTemplates)) return distTemplates;
  return join(pkgRoot, 'src', 'templates');
}

export function getViewerDir(): string {
  const pkgRoot = getPackageRoot();
  // 1. Published CLI: dist/viewer-template/ (bundled with CLI package)
  const bundled = join(pkgRoot, 'dist', 'viewer-template');
  if (existsSync(bundled)) return bundled;
  // 2. Monorepo development: packages/cli → packages/viewer
  return resolve(pkgRoot, '..', 'viewer');
}
