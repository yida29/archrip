import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import type { ArchitectureData } from './validate.js';

function makeData(overrides: Partial<ArchitectureData> = {}): ArchitectureData {
  return {
    version: '1.0',
    project: { name: 'test' },
    nodes: [
      { id: 'a', category: 'service', label: 'A', layer: 0 },
      { id: 'b', category: 'model', label: 'B', layer: 1 },
    ],
    edges: [{ source: 'a', target: 'b' }],
    ...overrides,
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
});
