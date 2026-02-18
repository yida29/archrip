import { useCallback, useMemo, useState } from 'react';

import type { ArchFlowNode } from '../types.ts';

export interface CommandPaletteResult {
  id: string;
  label: string;
  category: string;
  description: string;
}

interface CommandPaletteState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  query: string;
  setQuery: (q: string) => void;
  results: CommandPaletteResult[];
  activeIndex: number;
  moveUp: () => void;
  moveDown: () => void;
  activeItem: CommandPaletteResult | null;
}

const MAX_RESULTS = 20;

export function useCommandPalette(
  nodes: ArchFlowNode[],
  hiddenCategories: Set<string>,
): CommandPaletteState {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryRaw] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setQueryRaw('');
        setActiveIndex(0);
      }
      return !prev;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    setActiveIndex(0);
  }, []);

  const results = useMemo(() => {
    const searchable = nodes.filter(
      (n) => !n.hidden && !hiddenCategories.has(n.data.category),
    );

    if (!query.trim()) {
      return searchable.slice(0, MAX_RESULTS).map((n) => ({
        id: n.id,
        label: n.data.label,
        category: n.data.category,
        description: n.data.description,
      }));
    }

    const q = query.toLowerCase();
    return searchable
      .filter((n) => n.data.label.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
      .map((n) => ({
        id: n.id,
        label: n.data.label,
        category: n.data.category,
        description: n.data.description,
      }));
  }, [nodes, hiddenCategories, query]);

  const moveUp = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? prev : prev - 1));
  }, []);

  const moveDown = useCallback(() => {
    setActiveIndex((prev) => (prev >= results.length - 1 ? prev : prev + 1));
  }, [results.length]);

  const activeItem = results[activeIndex] ?? null;

  return { isOpen, toggle, close, query, setQuery, results, activeIndex, moveUp, moveDown, activeItem };
}
