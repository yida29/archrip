import { getCategoryColors, getCategoryLabel } from '../types.ts';

interface LegendProps {
  categories: string[];
}

export function Legend({ categories }: LegendProps) {
  return (
    <div
      className="absolute bottom-3 right-3 z-10 rounded-lg p-3 border"
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
        Legend
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {categories.map((cat) => {
          const colors = getCategoryColors(cat);
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border"
                style={{ background: colors.bg, borderColor: colors.border }}
              />
              <span className="text-xs" style={{ color: 'var(--color-content-secondary)' }}>
                {getCategoryLabel(cat)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
