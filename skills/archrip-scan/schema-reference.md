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
- `id`: kebab-case, prefixed by category abbreviation (ctrl-, svc-, port-, adpt-, model-, ext-, job-, dto-)
- `layer`: 0=external, 1=entry points, 2=application logic, 3=abstractions, 4=implementations, 5=data
- `category`: one of controller, service, port, adapter, model, external, job, dto (or custom)
- `label`: display name for the node
- `filePath`: relative from project root
- `depth` (optional): 0=overview (boundary), 1=structure (internal), 2=detail (implementation). Auto-inferred from category if omitted
- `useCases`: array of use case IDs this node participates in

## Edge Rules
- `source`: source node id
- `target`: target node id
- `type`: dependency | implements | relation
- Only include significant architectural dependencies (not utility imports)
- **Every node MUST have at least one edge.** If a node has no obvious dependency, connect it with a `relation` edge to the component that uses or contains it.

## Layout Selection
- DDD / Clean Architecture / Hexagonal / Onion Architecture → add `"layout": "concentric"` to `project`
- MVC / standard layered → `"layout": "dagre"` (default, can be omitted)

## Schema Rules
- Include table schema only when migration files or model annotations are available
- Reference from node data using schema key name
