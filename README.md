# archrips

Generate interactive architecture diagrams from your codebase using AI agents.

archrips lets AI agents (Claude Code, Gemini CLI, Codex) analyze your codebase and produce a self-contained, interactive architecture viewer as static HTML — deployable anywhere.

## Quick Start

```bash
# 1. Initialize in your project
npx archrips init .

# 2. Let your AI agent scan the codebase
#    (Claude Code example — other agents work similarly)
/archrips-scan

# 3. Build static HTML
npx archrips build

# 4. Preview
npx archrips serve
```

## How It Works

1. **`archrips init`** sets up `.archrips/` in your project and installs slash commands for your AI agent
2. **`/archrips-scan`** — the AI reads your codebase and generates `.archrips/architecture.json`
3. **`archrips build`** — validates the JSON, computes layout with dagre, and builds a static React Flow viewer
4. **`archrips serve`** — serves the built HTML locally for preview

The output is a standalone `dist/` folder you can deploy to GitHub Pages, Netlify, or share as a zip.

## CLI Commands

| Command | Description |
|---------|-------------|
| `archrips init [path]` | Initialize archrips in a project (default: `.`) |
| `archrips build` | Build the architecture viewer to `.archrips/dist/` |
| `archrips serve` | Preview the built viewer at `localhost:4173` |

## Slash Commands (AI Agent Prompts)

| Command | Description |
|---------|-------------|
| `/archrips-scan` | Full codebase scan → generate `architecture.json` |
| `/archrips-update` | Incremental update based on `git diff` |
| `/archrips-refine` | Interactive refinement (add/remove/modify nodes) |

Supports: Claude Code (`.claude/commands/`), Gemini CLI (`.gemini/commands/`), Codex (`.codex/commands/`).

## architecture.json Format

```json
{
  "version": "1.0",
  "project": {
    "name": "My App",
    "language": "TypeScript",
    "framework": "Next.js",
    "sourceUrl": "https://github.com/org/repo/blob/main/{filePath}"
  },
  "nodes": [
    {
      "id": "ctrl-users",
      "category": "controller",
      "label": "UsersController",
      "description": "User CRUD operations",
      "filePath": "src/controllers/users.ts",
      "layer": 1,
      "methods": ["list", "create", "update", "delete"],
      "routes": ["GET /api/users", "POST /api/users"],
      "useCases": ["uc-user-mgmt"]
    }
  ],
  "edges": [
    { "source": "ctrl-users", "target": "svc-users", "type": "dependency" }
  ],
  "useCases": [
    {
      "id": "uc-user-mgmt",
      "name": "User Management",
      "description": "CRUD operations for users",
      "nodeIds": ["ctrl-users", "svc-users", "model-user"]
    }
  ],
  "schemas": {
    "users": {
      "tableName": "users",
      "columns": [
        { "name": "id", "type": "BIGINT", "nullable": false, "index": "primary" },
        { "name": "email", "type": "VARCHAR(255)", "nullable": false, "index": "unique" }
      ]
    }
  }
}
```

### Node Categories

| Category | Color | Use For |
|----------|-------|---------|
| `controller` | Blue | HTTP entry points (Controller, Route Handler, Resolver) |
| `service` | Green | Business logic (Service, UseCase) |
| `port` | Purple | Abstractions (Interface, Contract, Port) |
| `adapter` | Orange | Implementations (Repository impl, API client) |
| `model` | Red | Data (Model, Entity, Schema) |
| `external` | Gray | External services (API, DB, Queue) |
| `job` | Yellow | Background (Job, Worker, Cron) |
| `dto` | Cyan | Data transfer (DTO, Request, Response) |

Custom categories are supported — they get a fallback color.

### Layers

The `layer` field controls vertical positioning (dagre handles horizontal):

| Layer | Typical Content |
|-------|----------------|
| 0 | External services |
| 1 | Entry points (controllers, routes) |
| 2 | Application logic (services, jobs, DTOs) |
| 3 | Abstractions (ports, interfaces) |
| 4 | Implementations (adapters) |
| 5 | Data (models, entities) |

### Edge Types

| Type | Meaning |
|------|---------|
| `dependency` | Component A depends on B |
| `implements` | Adapter implements Port/Interface |
| `relation` | Data relationship (hasMany, belongsTo) |

## Framework Support

archrips is framework-agnostic. The AI agent adapts its analysis based on the detected framework:

- **Laravel** — Controllers → Services → Ports → Adapters → Models
- **Express/NestJS** — Routes/Controllers → Services → Repositories → Models
- **Next.js** — Pages → Components → API Routes → Services
- **Django** — Views → Serializers → Services → Models
- **Spring Boot** — Controllers → Services → Repositories → Entities
- **Go** — Handlers → Services → Repositories → Models
- Any other — grouped by directory responsibility

## Viewer Features

- Interactive React Flow graph (drag, zoom, pan)
- Use case filtering (highlight specific feature flows)
- Detail panel (click nodes for full info: routes, methods, source links, DB schema)
- Color-coded categories with legend
- MiniMap navigation
- Source code links (GitHub, GitLab, Backlog, or any hosting)

## License

MIT
