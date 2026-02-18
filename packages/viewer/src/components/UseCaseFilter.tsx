import type { UseCase } from '../types.ts';
import type { FlowAnimationState } from '../hooks/useFlowAnimation.ts';

interface UseCaseFilterProps {
  useCases: UseCase[];
  selectedUseCase: string | null;
  onSelect: (useCaseId: string | null) => void;
  flowInfo: FlowAnimationState;
}

function FlowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded border text-xs cursor-pointer"
      style={{
        background: 'var(--color-surface-secondary)',
        borderColor: 'var(--color-border-primary)',
        color: 'var(--color-content-secondary)',
      }}
      aria-label={label}
    >
      {label === 'Previous' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M8 1.5L3.5 6L8 10.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label === 'Play' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 1.5L10 6L3 10.5V1.5Z" />
        </svg>
      )}
      {label === 'Pause' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="2.5" y="1.5" width="2.5" height="9" rx="0.5" />
          <rect x="7" y="1.5" width="2.5" height="9" rx="0.5" />
        </svg>
      )}
      {label === 'Next' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M4 1.5L8.5 6L4 10.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function UseCaseFilter({ useCases, selectedUseCase, onSelect, flowInfo }: UseCaseFilterProps) {
  const selectedUc = selectedUseCase ? useCases.find((uc) => uc.id === selectedUseCase) : undefined;

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
      {selectedUc && (
        <div className="mt-2">
          <p className="text-xs" style={{ color: 'var(--color-content-secondary)' }}>
            {selectedUc.description}
          </p>
          {flowInfo.flowNodeIds && (
            <div className="mt-1.5">
              <p
                className="text-xs font-mono mb-1.5"
                style={{ color: 'var(--color-interactive-primary)' }}
              >
                Step {flowInfo.activeStep + 1}/{flowInfo.flowNodeIds.length}
              </p>
              <div className="flex items-center gap-1">
                <FlowButton label="Previous" onClick={flowInfo.prev} />
                <FlowButton
                  label={flowInfo.isPlaying ? 'Pause' : 'Play'}
                  onClick={flowInfo.isPlaying ? flowInfo.pause : flowInfo.play}
                />
                <FlowButton label="Next" onClick={flowInfo.next} />
              </div>
            </div>
          )}
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
