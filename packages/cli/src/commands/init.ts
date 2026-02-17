import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { detectAgents, getAllAgentTypes } from '../utils/detect-agents.js';
import { detectProjectInfo } from '../utils/project-info.js';
import { getTemplatesDir } from '../utils/paths.js';
import { installViewer } from '../install/viewer.js';
import { installSlashCommands } from '../install/slash-commands.js';
import { updateGitignore } from '../utils/gitignore.js';

export async function init(targetPath: string): Promise<void> {
  const projectDir = resolve(targetPath);
  console.log(`\narchrips init — ${projectDir}\n`);

  // 1. Detect project info
  const projectInfo = detectProjectInfo(projectDir);
  console.log(`Detected: ${projectInfo.language}${projectInfo.framework ? ` / ${projectInfo.framework}` : ''}`);

  // 2. Create .archrips/ directory
  const archripsDir = join(projectDir, '.archrips');
  mkdirSync(archripsDir, { recursive: true });

  // 3. Write architecture.json skeleton
  const archJsonPath = join(archripsDir, 'architecture.json');
  if (!existsSync(archJsonPath)) {
    const templatesDir = getTemplatesDir();
    const skeleton = JSON.parse(readFileSync(join(templatesDir, 'skeleton.json'), 'utf-8')) as Record<string, unknown>;
    const project = skeleton.project as Record<string, string>;
    project.name = projectInfo.name;
    project.language = projectInfo.language;
    project.framework = projectInfo.framework;
    writeFileSync(archJsonPath, JSON.stringify(skeleton, null, 2) + '\n');
    console.log('  + .archrips/architecture.json (skeleton)');
  } else {
    console.log('  ~ .archrips/architecture.json (already exists, skipped)');
  }

  // 4. Copy viewer template
  installViewer(archripsDir);

  // 5. Detect agents and install slash commands
  const detected = detectAgents(projectDir);
  if (detected.length > 0) {
    console.log(`\nDetected AI agents: ${detected.map((a) => a.type).join(', ')}`);
    for (const agent of detected) {
      installSlashCommands(projectDir, agent.type);
    }
  } else {
    console.log('\nNo AI agent config detected. Installing commands for all agents...');
    for (const agentType of getAllAgentTypes()) {
      installSlashCommands(projectDir, agentType);
    }
  }

  // 6. Update .gitignore
  updateGitignore(projectDir);

  console.log(`
Done! Next steps:
  1. Run /archrips-scan in your AI agent to analyze the codebase
  2. Run: npx archrips build
  3. Run: npx archrips serve
`);
}
