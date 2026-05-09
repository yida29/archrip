---
description: Scan codebase and generate architecture diagram data
---

# archrip scan — Analyze codebase architecture

Analyze the current codebase and generate `.archrip/architecture.json`.

**Language rule:** Respond in the same language as the user's message or `$ARGUMENTS`. If no user text is available, detect the project's primary language from README/docs and match it. The `architecture.json` fields (labels, descriptions) should also use that language.

## Phase 1: Project Discovery
1. Read top-level files (package.json, composer.json, go.mod, Cargo.toml, pom.xml, pyproject.toml, etc.)
2. Identify language, framework, source root
3. List directory structure (2 levels deep)
4. Auto-detect `sourceUrl`: Run `git remote get-url origin` and convert to browse URL:
   - `git@github.com:org/repo.git` → `https://github.com/org/repo/blob/main/{filePath}`
   - `https://github.com/org/repo.git` → `https://github.com/org/repo/blob/main/{filePath}`
   - `git@gitlab.com:org/repo.git` → `https://gitlab.com/org/repo/-/blob/main/{filePath}`
   - If no git remote, leave empty (ask in Phase 7)

## Phase 2: Documentation Discovery
Read existing documentation to understand architecture context:
1. Check for: README.md, CLAUDE.md, docs/, doc/, wiki/, ARCHITECTURE.md, CONTRIBUTING.md, ADR/
2. For each document, extract and take notes on:
   - **Business context**: What problem does this system solve? Who are the users?
   - **Component responsibilities**: What each module/service does and why it exists
   - **Design decisions & constraints**: Why certain patterns/libraries were chosen, known limitations
   - **Data flow**: How data moves through the system (request lifecycle, event flow, etc.)
   - **External integrations**: What external services are used, why, and how
   - **Non-functional requirements**: SLAs, performance targets, security policies
   - **Deployment & infrastructure**: Hosting, CI/CD, environment details
3. Keep these notes — you will use them in Phase 4 to write rich node/edge descriptions and metadata

## Phase 3: Layer Identification
Assign each component a `layer` integer. The rule: **higher layer = closer to domain core (more stable, fewer external dependencies). Lower layer = closer to external world (more volatile, I/O-bound).**

Both layouts use this value — dagre places higher layers lower on screen, concentric places them at the center.

**Reference mappings** (layer numbers in parentheses — adapt to actual project structure):

MVC / Layered:
- Laravel: External(0) → Controllers(1) → Services(2) → Domain(3)
- Rails: External(0) → Controllers(1) → Services(2) → Domain(3)
- Django: External(0) → Views(1) → Serializers(2) → Services(3) → Domain(4)
- Spring Boot: External(0) → Controllers(1) → Services(2) → Repositories(3) → Domain(4)
- NestJS: External(0) → Controllers(1) → Services(2) → Repositories(3) → Domain(4)
- Next.js App Router: External(0) → Route Handlers/Pages(1) → Components(2) → Hooks/Services(3) → Data Access(4)
- FastAPI: External(0) → Routers(1) → Services(2) → Repositories(3) → Domain(4)

DDD / Clean Architecture / Hexagonal (use `"layout": "concentric"`):
- Generic: External(0) → Adapters(1) [Inbound (HTTP handlers, CLI), Outbound (DB impl, API clients)] → Application Core(2) [Use Cases / Application Services, Ports] → Domain(3)
- Go (Hex): External(0) → Adapters(1) [Handlers, Repositories] → Application Core(2) [Use Cases, Ports] → Domain(3)
- Flutter (Clean): External(0) → Data Sources(1) → Repositories(2) → Use Cases(3) → Domain(4)
- Note: Ports are interfaces owned by the **application core** (use cases / application services; sometimes placed in domain, but not required). Adapters implement outbound Ports and call inbound Ports. For layering, Ports should be at the same layer as the application core (or 1 step closer to Domain), never at the adapter layer.

CQRS / Event-Driven:
- CQRS: External(0) → Command Handlers / Query Handlers(1) → Application Services(2) → Domain(3). Command and Query sides share the same layer structure but separate models
- Event Sourcing: External(0) → Command Handlers(1) → Event Store(2) → Projections(3) → Read Models(4)
- Event-Driven (Motia, Temporal, etc.): External(0) → API Steps(1) → Event Steps(2) → Services(3) → Domain(4)

Serverless / Microservices:
- SST/Lambda: External(0) → Infrastructure(1) [sst.config.ts, CloudFormation] → API Gateway(2) → Lambda Handlers(3) → Services(4) → Domain(5)
- Microservices: External(0) → Infrastructure(1) [Terraform, Pulumi, K8s manifests] → Gateway/BFF(2) → Service Boundaries(3) → Internal Services(4) → Shared Domain(5)

Modular Monolith:
- Generic: External(0) → Module APIs(1) [public interfaces] → Module Internal Services(2) → Shared Kernel / Domain(3)

For unlisted frameworks: group by directory responsibility and apply the abstract rule above.

## Phase 4: Read Key Files
For each layer, read representative files to extract:
- Component names and purposes
- Dependencies (imports, injections)
- Public methods/routes
- Database schemas (from migrations or entity definitions)
- SQL queries / ORM operations (from repositories, DAOs, or query builders)

**Granularity: one node per real component.** Resist the urge to bundle siblings into umbrella nodes (e.g. a single `domain-shared-models` covering 9 entities, or one `adpt-shared-repos` for every repository implementation). Each Controller, UseCase, abstract Repository, Repository implementation, and Domain Entity is normally its own node. See **Node Granularity** under Schema Reference below for the exact rule of thumb.

**Repository → Port pattern:** in DDD/Hexagonal projects, every abstract Repository in `domains/` becomes a `port` node (layer = application core), and every concrete implementation in `infrastructures/` becomes an `adapter` node (outer layer). The use case depends on the port; the adapter `implements` the port. See **Repository → Port pattern** under Schema Reference below for the canonical shape.

**Enrich descriptions from documentation:** Cross-reference code with your Phase 2 notes.
For each component, compose a `description` (1-3 sentences) that covers:
- **What**: Its responsibility (from code analysis)
- **Why**: Business context or design rationale (from docs)
- **How**: Key implementation details, constraints, or patterns worth noting

A good description tells the reader something they cannot see from the label alone.
- BAD: "User service" (just echoes the label)
- GOOD: "Handles user registration, login, and profile management. Uses JWT for session tokens with 24h expiry. Password hashing via bcrypt (cost=12)."

Also identify metadata candidates:
- SLA/performance notes → `metadata` with `type: "list"`
- Related doc links → `metadata` with `type: "link"`
- Infrastructure details (Lambda ARN, DB engine, etc.) → `metadata` with `type: "code"` or `"text"`
- SQL queries or ORM operations → edge `metadata` with `type: "code"` or `"list"` (see Phase 5)

**Do NOT read every file.** Focus on entry points, core logic, interfaces, and data models.

## Phase 5: Map Relationships
For each component, identify:
- What it depends on (imports, constructor injection)
- What depends on it
- External service connections

**Edge type matters.** `dependency` / `implements` / `relation` are not interchangeable. In particular, `implements` edges always flow `adapter → port` — never adapter → entity, adapter → adapter, or adapter → database. If you cannot point an `implements` edge at a `port` node, the abstraction is missing from the diagram and should be added. See **Edge type semantics** under Schema Reference below.

**Connectivity check:** After mapping, verify every node has at least one edge. If a node is orphaned:
- DTOs/entities → connect to the service or adapter that references them
- External services → connect to the adapter/controller that integrates with them
- Entities → connect to the repository/adapter that references them
- Database nodes → connect to the adapter/repository that queries them
- Infrastructure nodes → connect to the adapter/service they provision

**Edge enrichment — SQL / query details:**
For edges connecting a service/adapter/repository to a database or entity node, include query information:
- `description`: summarize what data operation this edge performs (e.g., "Queries active users by email with JOIN on roles")
- `metadata`: include representative SQL or ORM queries found in the source code

Example:
```json
{
  "source": "adpt-user-repo",
  "target": "db-users",
  "type": "dependency",
  "description": "CRUD operations on users table; filters by email and status with role JOIN",
  "metadata": [
    { "label": "Queries", "value": ["SELECT u.*, r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?", "INSERT INTO users (name, email, role_id) VALUES (?, ?, ?)"], "type": "list" },
    { "label": "ORM", "value": "User::with('role')->where('email', $email)->first()", "type": "code" }
  ]
}
```

Guidelines:
- Include the most representative 2-3 queries (not every query)
- For ORMs (Eloquent, Drizzle, Prisma, etc.), use `type: "code"` with the ORM syntax
- For raw SQL, use `type: "list"` with individual queries
- Parameterize values (use `?` or `:param` placeholders, not literals)

## Phase 6: Identify Use Cases
Group related components into user-facing features.

## Phase 7: Draft Review — STOP and ask the developer

**IMPORTANT: Do NOT proceed to Phase 8 until the developer responds. You MUST stop here and wait for input.**

Present a summary of what you found:
- **Documents read**: List all docs you read in Phase 2 (e.g., README.md, CLAUDE.md, docs/architecture.md)
- List of discovered nodes (grouped by layer/category)
- List of discovered use cases
- External services found

Then ask:
- Are there other documents you should read? (e.g., docs/, wiki/, design docs)
- Are there missing components, external services, or use cases?
- Should anything be excluded?
- `sourceUrl` auto-detected as: `<detected-url>` — correct? (If not detected, ask for the `sourceUrl` template, e.g., `https://github.com/org/repo/blob/main/{filePath}`)

End your message with: **"Please review and reply with corrections, or type 'go' to generate."**

**Do NOT write architecture.json yet. Wait for the developer to respond.**

If the developer replies with corrections, apply them and present the updated summary. Repeat until they say "go" / "ok" / "skip".

## Phase 8: Generate architecture.json
Only run this phase AFTER the developer has approved the draft in Phase 7.

Create `.archrip/` directory if it doesn't exist, then write the complete `.archrip/architecture.json` following the schema, incorporating developer feedback.

After writing the file:
1. Run `npx archrip serve` in the terminal — it auto-builds and opens the browser. **Do NOT run `npx archrip build` separately or open the browser manually** (serve handles everything).
2. Tell the developer: Run `/archrip-update` to make further adjustments (add/remove nodes, fix relationships, etc.)

### Required structure (use EXACTLY these field names)

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

### Node Rules
- `id`: kebab-case, prefixed by category abbreviation (ctrl-, svc-, port-, adpt-, entity-, db-, infra-, ext-, job-, dto-)
- `layer`: non-negative integer. **Higher = closer to domain core / more stable. Lower = closer to external world / more volatile.** Dagre (TB) places higher layers lower on screen; concentric places them at center. Use as many layers as the architecture requires (typically 3-6). Example for DDD/Hex: 0=external, 1=adapters (controllers + infra), 2=application core (use cases/app services + ports), 3=domain. Example for MVC: 0=external, 1=controllers, 2=services, 3=domain.
- `category`: one of controller, service, port, adapter, entity, database, infrastructure, external, job, dto (or custom). Use `entity` for domain entities/value objects (core business logic). Use `database` for DB tables, migrations, ORMs. Use `infrastructure` for IaC resources (sst.config.ts, Terraform, Pulumi, CloudFormation, etc.)
- `label`: display name for the node
- `description`: 1-3 sentences explaining responsibility + business context. Do NOT just echo the label. Cross-reference documentation for richer context (see Description Guidelines below)
- `filePath`: relative from project root
- `useCases`: array of use case IDs this node participates in
- `metadata` (optional): array of `{ label, value, type? }` entries for supplementary info (AWS ARNs, doc links, SLA notes, etc.). `type` is `text` (default), `code`, `link`, or `list`. `value` is a string, or `string[]` when `type` is `list`. Example:
  ```json
  "metadata": [
    { "label": "Lambda ARN", "value": "arn:aws:lambda:ap-northeast-1:123:function:auth", "type": "code" },
    { "label": "API Docs", "value": "https://docs.example.com/auth", "type": "link" },
    { "label": "SLA", "value": ["99.9% uptime", "p95 < 200ms"], "type": "list" }
  ]
  ```

#### Node Granularity (avoid over-collapsing)

Prefer **one node per real component** over umbrella nodes that bundle many siblings together. Bundling hides dependencies and makes the diagram less actionable.

- BAD: a single `domain-shared-models` node covering User, Company, Farm, Barn, Room, Pen, Medication — relationships between siblings (e.g. Barn → Farm) become invisible.
- BAD: a single `adpt-shared-repos` node covering 9 repository implementations — you cannot see which use case touches which table.
- GOOD: one node per entity (`entity-user`, `entity-company`, `entity-farm`, ...) and one node per repository implementation (`adpt-user-repo`, `adpt-company-repo`, ...).

When bundling is acceptable:
- Tightly-coupled value objects within a single aggregate (e.g. `MatingScore`, `MatingEventBoar` shown together with `MatingEvent` is fine if they have no independent edges).
- Pure helper modules with no external dependents (e.g. validators / normalizers used by exactly one use case).
- Cross-cutting concerns surfaced as a single concept (e.g. all domain exceptions as one `entity-domain-exceptions` node).

Rule of thumb: if two candidate sub-components have **different sets of inbound or outbound edges**, split them into separate nodes.

#### Repository → Port pattern (DDD / Hexagonal)

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

### Edge Rules
- `source`: source node id
- `target`: target node id
- `type`: dependency | implements | relation
- `description` (optional): human-readable description of the edge's purpose
- `metadata` (optional): same format as node metadata — array of `{ label, value, type? }` entries
- Only include significant architectural dependencies (not utility imports)
- **Every node MUST have at least one edge.** If a node has no obvious dependency, connect it with a `relation` edge to the component that uses or contains it.

#### Edge type semantics

Pick the type that matches the relationship — they are not interchangeable:

- `dependency`: runtime/compile-time consumer-of relationship. The source needs the target to do its job (constructor injection, function call, HTTP/DB access).
- `implements`: the source is a concrete realization of the abstract target. **Direction is always `adapter → port`** (or `adapter → service-interface` when a service abstraction is used). Never point an `implements` edge at an entity, an adapter, or a database — that indicates the port abstraction is missing from the diagram. If you find yourself drawing `adpt-user-repo --implements--> entity-user`, the fix is to add a `port-user-repo` node and re-target the edge.
- `relation`: structural / associative link with no runtime direction (e.g. domain entity → its parent aggregate, or schema-to-schema FK references).

When in doubt, ask: "does this code line literally implement the target's interface?" If yes, `implements`. Otherwise, `dependency` or `relation`.

### Layout Selection
- DDD / Clean Architecture / Hexagonal / Onion Architecture → add `"layout": "concentric"` to `project`
- MVC / standard layered → `"layout": "dagre"` (default, can be omitted)

### Description Guidelines

#### Node `description`
Write 1-3 sentences that explain responsibility AND business context.
Cross-reference project documentation (README, CLAUDE.md, docs/) for richer context.
- BAD: "User service" (just echoes the label)
- BAD: "Handles users" (too vague)
- GOOD: "Handles user registration, authentication, and profile management. Uses JWT for session tokens; password hashing via bcrypt. Rate-limited to 10 req/s per IP."

#### Edge `description`
Explain WHY the dependency exists, not just THAT it exists.
- BAD: "calls" / "depends on"
- GOOD: "Delegates payment processing via Stripe SDK; retries on timeout (3x with exponential backoff)"

#### `metadata` for supplementary details
Use `metadata` to capture information from docs that doesn't fit in `description`:
```json
"metadata": [
  { "label": "SLA", "value": ["99.9% uptime", "p95 < 200ms"], "type": "list" },
  { "label": "Design Doc", "value": "https://...", "type": "link" },
  { "label": "Infrastructure", "value": "Lambda + DynamoDB (on-demand)", "type": "text" },
  { "label": "Rate Limit", "value": "10 req/s per IP", "type": "text" }
]
```

### Schema Rules
- Include table schema only when migration files or entity annotations are available
- Reference from node data using schema key name

$ARGUMENTS
