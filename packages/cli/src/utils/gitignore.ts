import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Append lines to .gitignore if not already present.
 */
export function updateGitignore(projectDir: string): void {
  const gitignorePath = join(projectDir, '.gitignore');
  const linesToAdd = ['.archrip/viewer/node_modules/', '.archrip/viewer/dist/', '.archrip/dist/'];

  let content = '';
  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, 'utf-8');
  }

  const missingLines = linesToAdd.filter((line) => !content.includes(line));
  if (missingLines.length > 0) {
    const separator = content.endsWith('\n') || content === '' ? '' : '\n';
    const block = `${separator}\n# archrip\n${missingLines.join('\n')}\n`;
    writeFileSync(gitignorePath, content + block);
    console.log('  + .gitignore (archrip entries)');
  }
}
