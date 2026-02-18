import { useEffect, useRef } from 'react';

import { getCategoryColors, getCategoryLabel } from '../types.ts';
import type { CommandPaletteResult } from '../hooks/useCommandPalette.ts';

interface CommandPaletteProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: CommandPaletteResult[];
  activeIndex: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CommandPalette({
  query,
  onQueryChange,
  results,
  activeIndex,
  onMoveUp,
  onMoveDown,
  onSelect,
  onClose,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveDown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) onSelect(item.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-60"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Palette card */}
      <div
        className="fixed z-60 rounded-xl border overflow-hidden"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--color-surface-primary)',
          borderColor: 'var(--color-border-primary)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Search input */}
        <div
          className="border-b"
          style={{ borderColor: 'var(--color-border-primary)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes..."
            className="w-full px-4 py-3 text-sm bg-transparent outline-none"
            style={{ color: 'var(--color-content-primary)' }}
          />
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="overflow-y-auto"
          style={{ maxHeight: 320 }}
        >
          {results.length === 0 && (
            <div
              className="px-4 py-6 text-center text-sm"
              style={{ color: 'var(--color-content-tertiary)' }}
            >
              No nodes found
            </div>
          )}
          {results.map((item, index) => {
            const colors = getCategoryColors(item.category);
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full px-4 py-2.5 flex items-start gap-3 text-left cursor-pointer border-none"
                style={{
                  background: isActive ? 'var(--color-surface-tertiary)' : 'transparent',
                }}
              >
                <div
                  className="w-3 h-3 rounded-sm border mt-0.5 shrink-0"
                  style={{ background: colors.bg, borderColor: colors.border }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-content-primary)' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-xs shrink-0"
                      style={{ color: 'var(--color-content-tertiary)' }}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  {item.description && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-content-secondary)' }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 border-t flex items-center gap-4 text-xs"
          style={{
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-content-tertiary)',
            background: 'var(--color-surface-secondary)',
          }}
        >
          <span><kbd className="font-mono">{'\u2191\u2193'}</kbd> Navigate</span>
          <span><kbd className="font-mono">{'\u21B5'}</kbd> Select</span>
          <span><kbd className="font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </>
  );
}
