import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getViewerDir } from '../utils/paths.js';

/**
 * Copy the viewer template to .archrips/viewer/
 */
export function installViewer(archripsDir: string): void {
  const viewerSrc = getViewerDir();
  const viewerDest = join(archripsDir, 'viewer');

  if (!existsSync(viewerSrc)) {
    console.log('  ! Viewer template not found (expected in monorepo). Skipping viewer copy.');
    return;
  }

  mkdirSync(viewerDest, { recursive: true });

  // Copy viewer files recursively, skipping node_modules and dist
  copyDirRecursive(viewerSrc, viewerDest, ['node_modules', 'dist', '.tsbuildinfo']);

  // Write marker file to verify viewer origin in build/serve
  writeFileSync(join(viewerDest, '.archrips-viewer'), 'archrips-official-viewer\n');
  console.log('  + .archrips/viewer/ (viewer template)');
}

function copyDirRecursive(src: string, dest: string, skipDirs: string[]): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.includes(entry.name)) continue;
    // Skip symlinks to prevent path traversal via symlink injection
    if (entry.isSymbolicLink()) continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, skipDirs);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
