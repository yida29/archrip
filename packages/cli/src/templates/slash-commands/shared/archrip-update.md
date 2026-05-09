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

## Schema constraints (apply on every write)

When adding or splitting nodes, follow the same rules the scan skill uses:

- **One node per real component.** Avoid umbrella nodes that bundle siblings — each Controller, UseCase, abstract Repository, Repository implementation, and Domain Entity is normally its own node. If two candidate sub-components have different sets of inbound or outbound edges, split them into separate nodes.
- **Repository → Port pattern (DDD/Hex).** Every abstract Repository becomes a `port` node in the application core (same layer as use cases); every implementation becomes an `adapter` node in the outer layer that `implements` the port. Use cases depend on the port, not the adapter.
- **`implements` edges flow `adapter → port`.** Never point them at entities, adapters, or databases — that signals a missing port abstraction. Add the missing `port` node and re-target the edge instead.

## After Update

After writing the file, run `npx archrip serve` in the terminal to rebuild and preview the updated diagram.

$ARGUMENTS
