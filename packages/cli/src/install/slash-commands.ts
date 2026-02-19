import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentType } from '../utils/detect-agents.js';
import { getTemplatesDir } from '../utils/paths.js';

const COMMAND_DIR_MAP: Record<AgentType, string> = {
  claude: '.claude/commands',
  gemini: '.gemini/commands',
  codex: '.codex/commands',
};

/**
 * Copy slash command templates for a specific agent type.
 * Shared templates are installed for all agents, then agent-specific
 * overrides (if any) are layered on top.
 */
export function installSlashCommands(projectDir: string, agentType: AgentType): void {
  const templatesDir = getTemplatesDir();
  const sharedDir = join(templatesDir, 'slash-commands', 'shared');
  const agentDir = join(templatesDir, 'slash-commands', agentType);

  const destDir = join(projectDir, COMMAND_DIR_MAP[agentType]);
  mkdirSync(destDir, { recursive: true });

  // Copy shared first, then agent-specific (override if same name)
  for (const srcDir of [sharedDir, agentDir]) {
    if (!existsSync(srcDir)) continue;
    for (const file of readdirSync(srcDir)) {
      const dest = join(destDir, file);
      if (!existsSync(dest)) {
        copyFileSync(join(srcDir, file), dest);
        console.log(`  + ${COMMAND_DIR_MAP[agentType]}/${file}`);
      } else {
        console.log(`  ~ ${COMMAND_DIR_MAP[agentType]}/${file} (already exists, skipped)`);
      }
    }
  }
}
