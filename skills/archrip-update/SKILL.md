---
name: archrip-update
description: Update or refine the architecture diagram
user-invocable: true
argument-hint: "[changes or instructions]"
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

When adding or splitting nodes, follow the same rules as the scan skill:

- **One node per real component.** Avoid umbrella nodes that bundle siblings — each Controller, UseCase, abstract Repository, Repository implementation, and Domain Entity is normally its own node. See [archrip-scan/schema-reference.md → Node Granularity](../archrip-scan/schema-reference.md#node-granularity-avoid-over-collapsing).
- **Repository → Port pattern (DDD/Hex).** Every abstract Repository becomes a `port` node in the application core; every implementation becomes an `adapter` node that `implements` the port. Use cases depend on the port, not the adapter. See [archrip-scan/schema-reference.md → Repository → Port pattern](../archrip-scan/schema-reference.md#repository--port-pattern-ddd--hexagonal).
- **`implements` edges flow `adapter → port`.** Never point them at entities, adapters, or databases — that signals a missing port abstraction. See [archrip-scan/schema-reference.md → Edge type semantics](../archrip-scan/schema-reference.md#edge-type-semantics).

## After Update

After writing the file, run `npx archrip serve` in the terminal to rebuild and preview the updated diagram.

$ARGUMENTS
