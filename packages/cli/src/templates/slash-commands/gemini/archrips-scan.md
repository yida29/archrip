---
description: Scan codebase and generate architecture diagram data
---

# archrips scan — Analyze codebase architecture

Analyze the current codebase and generate `.archrips/architecture.json`.

## Phase 1: Project Discovery
1. Read top-level files (package.json, composer.json, go.mod, Cargo.toml, pom.xml, pyproject.toml, etc.)
2. Identify language, framework, source root
3. List directory structure (2 levels deep)

## Phase 2: Documentation Discovery
Read existing documentation to understand architecture context:
1. Check for: README.md, CLAUDE.md, docs/, doc/, wiki/, ARCHITECTURE.md, CONTRIBUTING.md
2. Extract: system overview, component descriptions, external service integrations, design decisions
3. Use this knowledge to inform the analysis — documentation often reveals architectural intent that code alone does not show (use cases, business context, external dependencies)

## Phase 3: Layer Identification
Based on the framework, identify architectural layers:

**Common patterns:**
- Laravel: Controllers → Services → Ports → Adapters → Models
- Express/NestJS: Routes/Controllers → Services → Repositories → Models
- Next.js: Pages → Components → Hooks → API Routes → Services
- Django: Views → Serializers → Services → Models
- Spring Boot: Controllers → Services → Repositories → Entities
- Go: Handlers → Services → Repositories → Models
- Generic: Group by directory responsibility

## Phase 4: Read Key Files
For each layer, read representative files to extract:
- Component names and purposes
- Dependencies (imports, injections)
- Public methods/routes
- Database schemas (from migrations or model definitions)

**Do NOT read every file.** Focus on entry points, core logic, interfaces, and data models.

## Phase 5: Map Relationships
For each component, identify:
- What it depends on (imports, constructor injection)
- What depends on it
- External service connections

## Phase 6: Identify Use Cases
Group related components into user-facing features.

## Phase 7: Draft Review — Ask the Developer
Before writing the final output, present a summary of what you found and ask the developer to fill in gaps.

**Present:**
- List of discovered nodes (grouped by layer/category)
- List of discovered use cases
- External services found

**Ask about:**
- Missing components or layers not visible in code (e.g., infrastructure, CI/CD, queues, cron jobs)
- External services or APIs the system integrates with that aren't obvious from imports
- Key use cases or user flows that should be highlighted
- Any components that should be excluded (test utilities, legacy code, etc.)
- `sourceUrl` template if not already set (e.g., `https://github.com/org/repo/blob/main/{filePath}`)

If the developer says "skip" or provides no additional info, proceed with what was discovered.

**Revision loop:** If the developer requests changes to the draft, apply them and present the updated summary again. Repeat until the developer approves or says "ok" / "go".

## Phase 8: Generate architecture.json
Write the complete `.archrips/architecture.json` following the schema, incorporating developer feedback.

After writing the file, tell the developer:
- Run `npx archrips build && npx archrips serve` to preview
- Run `/archrips-refine` to make further adjustments (add/remove nodes, fix relationships, etc.)

### Node Rules
- `id`: kebab-case, prefixed by category abbreviation (ctrl-, svc-, port-, adpt-, model-, ext-, job-, dto-)
- `layer`: 0=external, 1=entry points, 2=application logic, 3=abstractions, 4=implementations, 5=data
- `category`: one of controller, service, port, adapter, model, external, job, dto (or custom)
- `filePath`: relative from project root
- `depth` (optional): 0=overview (boundary), 1=structure (internal), 2=detail (implementation). Auto-inferred from category if omitted
- `useCases`: array of use case IDs this node participates in

### Edge Rules
- `type`: dependency | implements | relation
- Only include significant architectural dependencies (not utility imports)

### Schema Rules
- Include table schema only when migration files or model annotations are available
- Reference from node data using schema key name

$ARGUMENTS
