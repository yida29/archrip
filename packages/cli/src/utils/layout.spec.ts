import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import type { ArchitectureData } from './validate.js';

function makeData(overrides: Partial<ArchitectureData> = {}): ArchitectureData {
  const { project, ...rest } = overrides;
  return {
    version: '1.0',
    project: { name: 'test', ...project },
    nodes: [
      { id: 'a', category: 'service', label: 'A', layer: 0 },
      { id: 'b', category: 'model', label: 'B', layer: 1 },
    ],
    edges: [{ source: 'a', target: 'b' }],
    ...rest,
  };
}

describe('computeLayout', () => {
  it('should return a layout node for each input node', () => {
    const result = computeLayout(makeData());
    expect(result.nodes).toHaveLength(2);
    const ids = result.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('should assign finite coordinates to all nodes', () => {
    const result = computeLayout(makeData());
    for (const node of result.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it('should set width and height to node constants', () => {
    const result = computeLayout(makeData());
    for (const node of result.nodes) {
      expect(node.width).toBe(180);
      expect(node.height).toBe(80);
    }
  });

  it('should place higher-layer nodes below lower-layer nodes (TB layout)', () => {
    const result = computeLayout(makeData());
    const nodeA = result.nodes.find((n) => n.id === 'a');
    const nodeB = result.nodes.find((n) => n.id === 'b');
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    // layer 0 should be above layer 1 in top-to-bottom layout
    expect(nodeA!.y).toBeLessThan(nodeB!.y);
  });

  it('should handle empty nodes and edges', () => {
    const result = computeLayout(makeData({ nodes: [], edges: [] }));
    expect(result.nodes).toHaveLength(0);
  });

  it('should handle nodes without edges', () => {
    const data = makeData({
      nodes: [
        { id: 'x', category: 'service', label: 'X', layer: 0 },
        { id: 'y', category: 'model', label: 'Y', layer: 0 },
      ],
      edges: [],
    });
    const result = computeLayout(data);
    expect(result.nodes).toHaveLength(2);
  });

  it('should handle many nodes at same layer', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => ({
      id: `n${i}`,
      category: 'service',
      label: `N${i}`,
      layer: 0,
    }));
    const result = computeLayout(makeData({ nodes, edges: [] }));
    expect(result.nodes).toHaveLength(5);
    // All should have similar y values (same rank)
    const ys = result.nodes.map((n) => n.y);
    const uniqueYs = new Set(ys.map((y) => Math.round(y)));
    expect(uniqueYs.size).toBe(1);
  });

  it('should use dagre layout when layout is not specified', () => {
    const result = computeLayout(makeData());
    const nodeA = result.nodes.find((n) => n.id === 'a');
    const nodeB = result.nodes.find((n) => n.id === 'b');
    // dagre TB: lower layer on top
    expect(nodeA!.y).toBeLessThan(nodeB!.y);
  });
});

describe('computeLayout (concentric)', () => {
  it('should return a layout node for each input node', () => {
    const result = computeLayout(makeData({
      project: { name: 'test', layout: 'concentric' },
    }));
    expect(result.nodes).toHaveLength(2);
    const ids = result.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('should place high-layer nodes closer to center than low-layer nodes', () => {
    const data = makeData({
      project: { name: 'test', layout: 'concentric' },
      nodes: [
        { id: 'ext', category: 'external', label: 'External', layer: 0 },
        { id: 'ctrl', category: 'controller', label: 'Controller', layer: 1 },
        { id: 'svc', category: 'service', label: 'Service', layer: 2 },
        { id: 'model', category: 'model', label: 'Model', layer: 5 },
      ],
      edges: [
        { source: 'ext', target: 'ctrl' },
        { source: 'ctrl', target: 'svc' },
        { source: 'svc', target: 'model' },
      ],
    });
    const result = computeLayout(data);

    const dist = (n: { x: number; y: number; width: number; height: number }) => {
      const cx = n.x + n.width / 2;
      const cy = n.y + n.height / 2;
      return Math.sqrt(cx * cx + cy * cy);
    };

    const modelNode = result.nodes.find((n) => n.id === 'model')!;
    const extNode = result.nodes.find((n) => n.id === 'ext')!;
    expect(dist(modelNode)).toBeLessThan(dist(extNode));
  });

  it('should place a single center node at (0, 0)', () => {
    const data = makeData({
      project: { name: 'test', layout: 'concentric' },
      nodes: [
        { id: 'model', category: 'model', label: 'Model', layer: 5 },
      ],
      edges: [],
    });
    const result = computeLayout(data);
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0]!;
    // Center of node should be at (0, 0)
    expect(node.x + node.width / 2).toBe(0);
    expect(node.y + node.height / 2).toBe(0);
  });

  it('should place nodes on the same ring at equal distance from center', () => {
    const data = makeData({
      project: { name: 'test', layout: 'concentric' },
      nodes: [
        { id: 'a', category: 'service', label: 'A', layer: 3 },
        { id: 'b', category: 'service', label: 'B', layer: 3 },
        { id: 'c', category: 'service', label: 'C', layer: 3 },
      ],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
    });
    const result = computeLayout(data);

    const dist = (n: { x: number; y: number; width: number; height: number }) => {
      const cx = n.x + n.width / 2;
      const cy = n.y + n.height / 2;
      return Math.sqrt(cx * cx + cy * cy);
    };

    const distances = result.nodes.map(dist);
    // All should be approximately equal
    for (const d of distances) {
      expect(d).toBeCloseTo(distances[0]!, 1);
    }
  });

  it('should handle empty nodes', () => {
    const result = computeLayout(makeData({
      project: { name: 'test', layout: 'concentric' },
      nodes: [],
      edges: [],
    }));
    expect(result.nodes).toHaveLength(0);
  });

  it('should assign finite coordinates to all nodes', () => {
    const data = makeData({
      project: { name: 'test', layout: 'concentric' },
    });
    const result = computeLayout(data);
    for (const node of result.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });
});
