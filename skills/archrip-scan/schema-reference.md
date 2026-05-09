# architecture.json Schema Reference

## Required structure (use EXACTLY these field names)

```json
{
  "version": "1.0",
  "project": { "name": "...", "sourceUrl": "https://github.com/org/repo/blob/main/{filePath}" },
  "nodes": [
    { "id": "ctrl-users", "category": "controller", "label": "UsersController", "layer": 1, "filePath": "src/controllers/users.ts", "useCases": ["uc-user-mgmt"] }
  ],
  "edges": [
    { "source": "ctrl-users", "target": "svc-users", "type": "dependency" }
  ],
  "useCases": [
    { "id": "uc-user-mgmt", "name": "User Management", "nodeIds": ["ctrl-users", "svc-users"] }
  ]
}
```

**Critical field names — do NOT use alternatives:**
- Node: `id`, `category`, `label` (NOT name), `layer` — all required
- Edge: `source`, `target` (NOT from/to) — all required
- UseCase: `id`, `name`, `nodeIds` — all required

## Node Rules
- `id`: kebab-case, prefixed by category abbreviation (ctrl-, svc-, port-, adpt-, entity-, db-, infra-, ext-, job-, dto-)
- `layer`: non-negative integer. Higher = closer to domain core. See SKILL.md Phase 3 for framework-specific mappings
- For Hexagonal/DDD: Ports are interfaces in the application core (often the same layer as use cases/app services); adapters implement them.
- `category`: one of controller, service, port, adapter, entity, database, infrastructure, external, job, dto (or custom). Use `entity` for domain entities/value objects (core business logic). Use `database` for DB tables, migrations, ORMs. Use `infrastructure` for IaC resources (sst.config.ts, Terraform, Pulumi, CloudFormation, etc.)
- `label`: display name for the node
- `filePath`: relative from project root
- `useCases`: array of use case IDs this node participates in

### Node Granularity (avoid over-collapsing)

Prefer **one node per real component** over umbrella nodes that bundle many siblings together. Bundling hides dependencies and makes the diagram less actionable.

- BAD: a single `domain-shared-models` node covering User, Company, Farm, Barn, Room, Pen, Medication — relationships between siblings (e.g. Barn → Farm) become invisible.
- BAD: a single `adpt-shared-repos` node covering 9 repository implementations — you cannot see which use case touches which table.
- GOOD: one node per entity (`entity-user`, `entity-company`, `entity-farm`, ...) and one node per repository implementation (`adpt-user-repo`, `adpt-company-repo`, ...).

When bundling is acceptable:
- Tightly-coupled value objects within a single aggregate (e.g. `MatingScore`, `MatingEventBoar` shown together with `MatingEvent` is fine if they have no independent edges).
- Pure helper modules with no external dependents (e.g. validators / normalizers used by exactly one use case).
- Cross-cutting concerns surfaced as a single concept (e.g. all domain exceptions as one `entity-domain-exceptions` node).

Rule of thumb: if two candidate sub-components have **different sets of inbound or outbound edges**, split them into separate nodes.

### Repository → Port pattern (DDD / Hexagonal)

In DDD/Onion projects, the abstract `Repository` interface (defined in `domains/`) and its concrete implementation (in `infrastructures/`) are TWO different nodes:

- The interface becomes a `port` node in the application-core layer (same layer as use cases).
- The implementation becomes an `adapter` node in the outer layer.
- An `implements` edge goes from the adapter to the port.
- Use cases depend on the port (not the adapter), via constructor injection.

Example shape:

```json
{
  "nodes": [
    { "id": "port-user-repo", "category": "port", "label": "UserRepository (port)", "layer": 2,
      "filePath": "src/shared/domains/models/user/user.repository.ts" },
    { "id": "adpt-user-repo", "category": "adapter", "label": "UserRepositoryImpl", "layer": 1,
      "filePath": "src/shared/infrastructures/repositories/user.repository.impl.ts" },
    { "id": "uc-register-user", "category": "service", "label": "RegisterUserUseCase", "layer": 2,
      "filePath": "src/auth/applications/register-user.usecase.ts" }
  ],
  "edges": [
    { "source": "uc-register-user", "target": "port-user-repo", "type": "dependency" },
    { "source": "adpt-user-repo", "target": "port-user-repo", "type": "implements" },
    { "source": "adpt-user-repo", "target": "db-shared", "type": "dependency" }
  ]
}
```

Do NOT make the use case depend on the adapter directly, and do NOT collapse the port + adapter into a single entity-flavored node. The whole point of the pattern is that the application core is unaware of the implementation.

## Edge Rules
- `source`: source node id
- `target`: target node id
- `type`: dependency | implements | relation
- `description` (optional): human-readable description of the edge's purpose
- `metadata` (optional): same format as node metadata — array of `{ label, value, type? }` entries. Use for SQL/query details on DB edges (see examples below)
- Only include significant architectural dependencies (not utility imports)
- **Every node MUST have at least one edge.** If a node has no obvious dependency, connect it with a `relation` edge to the component that uses or contains it.

### Edge type semantics

Pick the type that matches the relationship — they are not interchangeable:

- `dependency`: runtime/compile-time consumer-of relationship. The source needs the target to do its job (constructor injection, function call, HTTP/DB access).
- `implements`: the source is a concrete realization of the abstract target. **Direction is always `adapter → port`** (or `adapter → service-interface` when a service abstraction is used). Never point an `implements` edge at an entity, an adapter, or a database — that indicates the port abstraction is missing from the diagram. If you find yourself drawing `adpt-user-repo --implements--> entity-user`, the fix is to add a `port-user-repo` node and re-target the edge.
- `relation`: structural / associative link with no runtime direction (e.g. domain entity → its parent aggregate, or schema-to-schema FK references).

When in doubt, ask: "does this code line literally implement the target's interface?" If yes, `implements`. Otherwise, `dependency` or `relation`.

## Layout Selection
- DDD / Clean Architecture / Hexagonal / Onion Architecture → add `"layout": "concentric"` to `project`
- MVC / standard layered → `"layout": "dagre"` (default, can be omitted)

## Description & Metadata Guidelines

### Node `description`
Write 1-3 sentences that explain responsibility AND business context.
Cross-reference project documentation (README, CLAUDE.md, docs/) for richer context.
- BAD: "User service" (just echoes the label)
- BAD: "Handles users" (too vague)
- GOOD: "Handles user registration, authentication, and profile management. Uses JWT for session tokens; password hashing via bcrypt. Rate-limited to 10 req/s per IP."

### Edge `description`
Explain WHY the dependency exists, not just THAT it exists.
- BAD: "calls" / "depends on"
- GOOD: "Delegates payment processing via Stripe SDK; retries on timeout (3x with exponential backoff)"

### `metadata` for supplementary details
Use `metadata` to capture information from docs that doesn't fit in `description`:
```json
"metadata": [
  { "label": "SLA", "value": ["99.9% uptime", "p95 < 200ms"], "type": "list" },
  { "label": "Design Doc", "value": "https://...", "type": "link" },
  { "label": "Infrastructure", "value": "Lambda + DynamoDB (on-demand)", "type": "text" },
  { "label": "Rate Limit", "value": "10 req/s per IP", "type": "text" },
  { "label": "Queries", "value": ["SELECT * FROM users WHERE email = ?", "INSERT INTO users (name, email) VALUES (?, ?)"], "type": "list" }
]
```

## Schema Rules
- Include table schema only when migration files or entity annotations are available
- Reference from node data using schema key name
