import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentType } from '../utils/detect-agents.js';
import { getTemplatesDir } from '../utils/paths.js';

/**
 * Copy slash command templates for a specific agent type.
 */
export function installSlashCommands(projectDir: string, agentType: AgentType): void {
  const templatesDir = getTemplatesDir();
  const srcDir = join(templatesDir, 'slash-commands', agentType);
  if (!existsSync(srcDir)) return;

  const commandDirMap: Record<AgentType, string> = {
    claude: '.claude/commands',
    gemini: '.gemini/commands',
    codex: '.codex/commands',
  };

  const destDir = join(projectDir, commandDirMap[agentType]);
  mkdirSync(destDir, { recursive: true });

  const files = readdirSync(srcDir);
  for (const file of files) {
    const dest = join(destDir, file);
    if (!existsSync(dest)) {
      copyFileSync(join(srcDir, file), dest);
      console.log(`  + ${commandDirMap[agentType]}/${file}`);
    } else {
      console.log(`  ~ ${commandDirMap[agentType]}/${file} (already exists, skipped)`);
    }
  }
}
