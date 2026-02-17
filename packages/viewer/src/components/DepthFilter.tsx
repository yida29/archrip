import { DEPTH_LEVELS } from '../types.ts';
import type { DepthLevel } from '../types.ts';

interface DepthFilterProps {
  depthLevel: DepthLevel;
  onSelect: (level: DepthLevel) => void;
}

export function DepthFilter({ depthLevel, onSelect }: DepthFilterProps) {
  return (
    <div
      className="rounded-lg p-3 w-64 border"
      style={{
        background: 'var(--color-surface-primary)',
        borderColor: 'var(--color-border-primary)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'var(--color-content-tertiary)' }}
      >
        Depth
      </h3>
      <div className="flex gap-1">
        {DEPTH_LEVELS.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className="flex-1 text-xs py-1.5 px-2 rounded font-medium transition-colors cursor-pointer"
            style={
              depthLevel === level
                ? { background: 'var(--color-interactive-primary)', color: 'var(--color-content-inverse)' }
                : { background: 'var(--color-surface-secondary)', color: 'var(--color-content-secondary)' }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
