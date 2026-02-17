import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface ArchitectureData {
  version: string;
  project: {
    name: string;
    description?: string;
    language?: string;
    framework?: string;
    sourceUrl?: string;
  };
  nodes: ArchNode[];
  edges: ArchEdge[];
  useCases?: ArchUseCase[];
  schemas?: Record<string, TableSchema>;
}

export interface ArchNode {
  id: string;
  category: string;
  label: string;
  description?: string;
  filePath?: string;
  layer: number;
  methods?: string[];
  routes?: string[];
  useCases?: string[];
  schema?: string;
  implements?: string;
  externalService?: string;
  sqlExamples?: string[];
}

export interface ArchEdge {
  source: string;
  target: string;
  label?: string | null;
  type?: 'dependency' | 'implements' | 'relation';
}

export interface ArchUseCase {
  id: string;
  name: string;
  description?: string;
  nodeIds: string[];
  flow?: string[];
}

// Keep in sync with packages/viewer/src/types.ts (ColumnSchema, TableSchema)
export interface ColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  index?: string;
  foreignKey?: { table: string; column: string; onDelete?: string };
}

// Keep in sync with packages/viewer/src/types.ts (ColumnSchema, TableSchema)
export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
  indexes?: string[];
  enumValues?: Record<string, Record<string, string>>;
}

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Verify that the viewer directory was created by `archrips init`.
 * Checks: existence, symlink rejection, path containment, marker file, package.json name.
 * Throws if any check fails.
 */
export function validateViewerDir(viewerDir: string): void {
  if (!existsSync(viewerDir)) {
    throw new Error(
      '.archrips/viewer/ not found.\nRun `npx archrips init .` to set up the viewer.',
    );
  }

  // Reject symlinks — prevent redirection to arbitrary directories
  if (lstatSync(viewerDir).isSymbolicLink()) {
    throw new Error(
      '.archrips/viewer/ is a symbolic link, which is not allowed.\n'
      + 'This is a safety check to prevent executing code outside the project.\n'
      + 'Remove the symlink and re-run `npx archrips init .`.',
    );
  }

  // Ensure realpath stays within .archrips/
  const archripsDir = resolve(viewerDir, '..');
  const realViewerDir = realpathSync(viewerDir);
  const realArchripsDir = realpathSync(archripsDir);
  if (!realViewerDir.startsWith(realArchripsDir + '/')) {
    throw new Error(
      '.archrips/viewer/ resolves outside of .archrips/.\n'
      + 'This is a safety check to prevent executing code outside the project.',
    );
  }

  // Check marker file
  const markerPath = join(viewerDir, '.archrips-viewer');
  if (!existsSync(markerPath) || readFileSync(markerPath, 'utf-8').trim() !== 'archrips-official-viewer') {
    throw new Error(
      '.archrips/viewer/ does not appear to be an official archrips viewer.\n'
      + 'This is a safety check to prevent executing untrusted code.\n'
      + 'Re-run `npx archrips init .` to reinstall the viewer.',
    );
  }

  // Verify package.json identity
  const pkgJsonPath = join(viewerDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    throw new Error(
      '.archrips/viewer/package.json not found.\n'
      + 'Re-run `npx archrips init .` to reinstall the viewer.',
    );
  }
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
  if (pkg.name !== 'archrips-viewer') {
    throw new Error(
      '.archrips/viewer/package.json has unexpected name.\n'
      + 'This is a safety check to prevent executing untrusted code.\n'
      + 'Re-run `npx archrips init .` to reinstall the viewer.',
    );
  }
}

/**
 * Load and validate architecture.json.
 * Does structural validation without requiring ajv (zero extra dependencies).
 */
export function loadAndValidate(filePath: string): { data: ArchitectureData; errors: ValidationError[] } {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as ArchitectureData;
  const errors: ValidationError[] = [];

  // Required top-level fields
  if (data.version !== '1.0') {
    errors.push({ path: 'version', message: `Expected "1.0", got "${String(data.version)}"` });
  }
  if (!data.project?.name) {
    errors.push({ path: 'project.name', message: 'Required field missing' });
  }
  if (data.project?.sourceUrl) {
    try {
      const url = new URL(data.project.sourceUrl.replace('{filePath}', 'test'));
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push({ path: 'project.sourceUrl', message: 'Must use http: or https: protocol' });
      }
    } catch {
      errors.push({ path: 'project.sourceUrl', message: 'Must be a valid URL template' });
    }
  }
  if (!Array.isArray(data.nodes)) {
    errors.push({ path: 'nodes', message: 'Must be an array' });
  }
  if (!Array.isArray(data.edges)) {
    errors.push({ path: 'edges', message: 'Must be an array' });
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  if (Array.isArray(data.nodes)) {
    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i]!;
      const prefix = `nodes[${i}]`;
      if (!node.id) errors.push({ path: `${prefix}.id`, message: 'Required' });
      if (!node.category) errors.push({ path: `${prefix}.category`, message: 'Required' });
      if (!node.label) errors.push({ path: `${prefix}.label`, message: 'Required' });
      if (typeof node.layer !== 'number') {
        errors.push({ path: `${prefix}.layer`, message: 'Must be a number' });
      } else if (!Number.isInteger(node.layer) || node.layer < 0 || node.layer > 100) {
        errors.push({ path: `${prefix}.layer`, message: 'Must be an integer between 0 and 100' });
      }
      if (node.filePath) {
        if (node.filePath.includes('..') || node.filePath.startsWith('/')) {
          errors.push({ path: `${prefix}.filePath`, message: 'Must be a relative path without ".." segments' });
        }
      }
      if (node.id && nodeIds.has(node.id)) {
        errors.push({ path: `${prefix}.id`, message: `Duplicate node id: "${node.id}"` });
      }
      if (node.id) nodeIds.add(node.id);
    }
  }

  // Validate edges reference existing nodes
  if (Array.isArray(data.edges)) {
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i]!;
      const prefix = `edges[${i}]`;
      if (!edge.source) errors.push({ path: `${prefix}.source`, message: 'Required' });
      if (!edge.target) errors.push({ path: `${prefix}.target`, message: 'Required' });
      if (edge.source && !nodeIds.has(edge.source)) {
        errors.push({ path: `${prefix}.source`, message: `References unknown node: "${edge.source}"` });
      }
      if (edge.target && !nodeIds.has(edge.target)) {
        errors.push({ path: `${prefix}.target`, message: `References unknown node: "${edge.target}"` });
      }
    }
  }

  // Validate use cases reference existing nodes
  if (Array.isArray(data.useCases)) {
    for (let i = 0; i < data.useCases.length; i++) {
      const uc = data.useCases[i]!;
      const prefix = `useCases[${i}]`;
      if (!uc.id) errors.push({ path: `${prefix}.id`, message: 'Required' });
      if (!uc.name) errors.push({ path: `${prefix}.name`, message: 'Required' });
      if (Array.isArray(uc.nodeIds)) {
        for (const nodeId of uc.nodeIds) {
          if (!nodeIds.has(nodeId)) {
            errors.push({ path: `${prefix}.nodeIds`, message: `References unknown node: "${nodeId}"` });
          }
        }
      }
    }
  }

  // Detect circular edges
  if (Array.isArray(data.edges) && nodeIds.size > 0) {
    const adj = new Map<string, string[]>();
    for (const edge of data.edges) {
      if (edge.source && edge.target) {
        const targets = adj.get(edge.source);
        if (targets) {
          targets.push(edge.target);
        } else {
          adj.set(edge.source, [edge.target]);
        }
      }
    }
    const visited = new Set<string>();
    const inStack = new Set<string>();
    let hasCycle = false;
    function dfs(node: string): void {
      if (hasCycle) return;
      visited.add(node);
      inStack.add(node);
      for (const neighbor of adj.get(node) ?? []) {
        if (inStack.has(neighbor)) {
          hasCycle = true;
          errors.push({ path: 'edges', message: `Circular dependency detected involving "${neighbor}"` });
          return;
        }
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
      inStack.delete(node);
    }
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
        if (hasCycle) break;
      }
    }
  }

  return { data, errors };
}

/**
 * Resolve a sourceUrl template with a filePath.
 * Encodes path segments and only allows http/https URLs.
 * Keep in sync with packages/viewer/src/data/loader.ts (resolveSourceUrl)
 */
export function resolveSourceUrl(template: string | undefined, filePath: string): string {
  if (!template || !filePath) return '';

  const encoded = filePath.split('/').map(encodeURIComponent).join('/');
  const resolved = template.replace('{filePath}', encoded);

  try {
    const url = new URL(resolved);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}
