import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { build } from './build.js';

export async function serve(): Promise<void> {
  const projectDir = process.cwd();
  const distDir = join(projectDir, '.archrips', 'dist');
  const viewerDir = join(projectDir, '.archrips', 'viewer');

  // Verify viewer origin before executing anything in that directory
  const markerPath = join(viewerDir, '.archrips-viewer');
  if (!existsSync(markerPath) || readFileSync(markerPath, 'utf-8').trim() !== 'archrips-official-viewer') {
    console.error('Error: .archrips/viewer/ does not appear to be an official archrips viewer.');
    console.error('This is a safety check to prevent executing untrusted code.');
    console.error('Re-run `npx archrips init .` to reinstall the viewer.');
    process.exit(1);
  }

  // Auto-build if dist doesn't exist
  if (!existsSync(join(distDir, 'index.html'))) {
    console.log('No build found. Running build first...\n');
    await build();
  }

  console.log('\narchrips serve — Starting preview server...\n');

  // Use vite preview to serve the built files
  try {
    execSync('npx vite preview --port 4173 --open', {
      cwd: viewerDir,
      stdio: 'inherit',
    });
  } catch {
    // User interrupted with Ctrl+C — that's fine
  }
}
