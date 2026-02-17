import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ArchFlowNode } from '../../types.ts';
import { getCategoryColors, getCategoryIcon } from '../../types.ts';

export function ArchNode({ data, selected }: NodeProps<ArchFlowNode>) {
  const d = data;
  const colors = getCategoryColors(d.category);
  const icon = getCategoryIcon(d.category);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <div
        style={{
          background: colors.bg,
          border: `2px solid ${selected ? 'var(--color-border-focus)' : colors.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 140,
          maxWidth: 200,
          cursor: 'pointer',
          boxShadow: selected ? 'var(--shadow-node-selected)' : 'var(--shadow-node)',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
      >
        <div style={{ fontSize: 11, color: colors.text, opacity: 0.7, marginBottom: 2 }}>
          {icon} {d.category.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, lineHeight: 1.3, wordBreak: 'break-word' }}>
          {d.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
    </>
  );
}
