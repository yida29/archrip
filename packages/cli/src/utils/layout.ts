import dagre from '@dagrejs/dagre';
import type { ArchitectureData } from './validate.js';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const RANK_SEP = 160;
const NODE_SEP = 40;

// Concentric layout constants
const RING_SPACING = 250;
const MIN_ARC_SPACING = 200;

/**
 * Compute node positions using the layout algorithm specified by project.layout.
 * Defaults to dagre (top-to-bottom) if not specified.
 */
export function computeLayout(data: ArchitectureData): LayoutResult {
  if (data.project.layout === 'concentric') {
    return computeConcentricLayout(data);
  }
  return computeDagreLayout(data);
}

/**
 * Dagre auto-layout (top-to-bottom).
 * Uses the `layer` field as dagre rank to control vertical positioning.
 */
function computeDagreLayout(data: ArchitectureData): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with layer as rank
  for (const node of data.nodes) {
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rank: node.layer,
    });
  }

  // Add edges
  for (const edge of data.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: LayoutNode[] = [];
  for (const nodeId of g.nodes()) {
    const n = g.node(nodeId);
    if (n) {
      nodes.push({
        id: nodeId,
        x: n.x - NODE_WIDTH / 2,
        y: n.y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  }

  return { nodes };
}

/**
 * Concentric (onion) layout for DDD/Clean Architecture.
 * High layer values (domain entities) are placed at the center,
 * low layer values (external) are placed on the outer rings.
 */
function computeConcentricLayout(data: ArchitectureData): LayoutResult {
  if (data.nodes.length === 0) {
    return { nodes: [] };
  }

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  for (const node of data.nodes) {
    const group = layerGroups.get(node.layer);
    if (group) {
      group.push(node.id);
    } else {
      layerGroups.set(node.layer, [node.id]);
    }
  }

  // Sort layers descending: highest layer = ring 0 (center)
  const sortedLayers = [...layerGroups.keys()].sort((a, b) => b - a);

  const nodes: LayoutNode[] = [];

  for (let ringIndex = 0; ringIndex < sortedLayers.length; ringIndex++) {
    const layer = sortedLayers[ringIndex]!;
    const nodeIds = layerGroups.get(layer)!;
    const count = nodeIds.length;

    if (ringIndex === 0 && count === 1) {
      // Single center node at origin
      nodes.push({
        id: nodeIds[0]!,
        x: -NODE_WIDTH / 2,
        y: -NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
      continue;
    }

    // Dynamic radius: ensure nodes don't overlap
    // Ring 0 uses RING_SPACING / 2 as minimum to avoid origin clustering
    const baseRadius = Math.max(ringIndex * RING_SPACING, RING_SPACING / 2);
    const circumference = count * MIN_ARC_SPACING;
    const minRadius = circumference / (2 * Math.PI);
    const ringRadius = Math.max(minRadius, baseRadius);

    for (let i = 0; i < count; i++) {
      // Start from top (-PI/2) and distribute evenly
      const angle = i * (2 * Math.PI / count) - Math.PI / 2;
      const x = ringRadius * Math.cos(angle);
      const y = ringRadius * Math.sin(angle);

      nodes.push({
        id: nodeIds[i]!,
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  }

  return { nodes };
}
