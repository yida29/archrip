---
description: Update or refine the architecture diagram
---

# archrip update — Update architecture diagram

Read `.archrip/architecture.json` and update it.

## Mode 1: Auto-detect from git diff (no arguments)

If `$ARGUMENTS` is empty:

1. Run `git diff --name-only HEAD~10` to find changed files
2. Read the current `.archrip/architecture.json`
3. For each changed file:
   - New component? → Add node + edges
   - Removed component? → Remove node + edges + use case references
   - Changed dependencies? → Update edges
4. Preserve existing node IDs for unchanged components
5. Write updated `.archrip/architecture.json`

## Mode 2: Apply requested changes (with arguments)

If `$ARGUMENTS` is provided, apply the user's requested changes:
- Add/remove/modify nodes
- Fix relationships
- Add/modify use cases
- Adjust layer assignments
- Add database schemas
- Add/modify metadata entries
- Improve descriptions

Write the updated `.archrip/architecture.json`.

## After Update

After writing the file, run `npx archrip serve` in the terminal to rebuild and preview the updated diagram.

$ARGUMENTS
