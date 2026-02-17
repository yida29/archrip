import type { UseCase } from '../types.ts';

interface UseCaseFilterProps {
  useCases: UseCase[];
  selectedUseCase: string | null;
  onSelect: (useCaseId: string | null) => void;
}

export function UseCaseFilter({ useCases, selectedUseCase, onSelect }: UseCaseFilterProps) {
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
        Use Case Filter
      </h3>
      <select
        value={selectedUseCase ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 border"
        style={{
          background: 'var(--color-surface-primary)',
          borderColor: 'var(--color-border-secondary)',
          color: 'var(--color-content-primary)',
          '--tw-ring-color': 'var(--color-border-focus)',
        } as React.CSSProperties}
      >
        <option value="">Show All</option>
        {useCases.map((uc) => (
          <option key={uc.id} value={uc.id}>
            {uc.name}
          </option>
        ))}
      </select>
      {selectedUseCase && (
        <div className="mt-2">
          <p className="text-xs" style={{ color: 'var(--color-content-secondary)' }}>
            {useCases.find((uc) => uc.id === selectedUseCase)?.description}
          </p>
          <button
            onClick={() => onSelect(null)}
            className="mt-1.5 text-xs cursor-pointer hover:underline"
            style={{ color: 'var(--color-interactive-primary)' }}
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
