'use client';

import { Priority } from '@/types/index';
import ColorPicker from '@/components/shared/ColorPicker';

interface PriorityListProps {
  priorities: Priority[];
  onMovePriority: (index: number, direction: 'up' | 'down') => void;
  onDeletePriority: (id: string) => Promise<void>;
  onUpdateColor: (id: string, newColor: string) => Promise<void>;
}

export default function PriorityList({
  priorities,
  onMovePriority,
  onDeletePriority,
  onUpdateColor,
}: PriorityListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.25rem' }}>
      {priorities.map((priority, index) => (
        <div
          key={priority.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.45rem 0.6rem',
            borderRadius: 'var(--radius-md)',
            gap: '0.5rem',
            transition: 'background 0.15s',
          }}
          className="priority-list-row"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Color dot */}
          <ColorPicker
            color={priority.color || '#6366f1'}
            onChange={(val) => onUpdateColor(priority.id, val)}
            size={10}
            title="Change priority color"
          />

          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-base)', marginLeft: '0.25rem' }}>
            {priority.name}
          </span>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.1rem' }}>
            <button
              onClick={() => onMovePriority(index, 'up')}
              disabled={index === 0}
              title="Move up"
              style={{
                padding: '0.2rem 0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'none',
                color: index === 0 ? 'var(--color-surface-4)' : 'var(--color-text-faint)',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.7rem',
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { if (index !== 0) (e.currentTarget.style.color = 'var(--color-primary-light)'); }}
              onMouseLeave={(e) => { (e.currentTarget.style.color = index === 0 ? 'var(--color-surface-4)' : 'var(--color-text-faint)'); }}
            >
              ↑
            </button>
            <button
              onClick={() => onMovePriority(index, 'down')}
              disabled={index === priorities.length - 1}
              title="Move down"
              style={{
                padding: '0.2rem 0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'none',
                color: index === priorities.length - 1 ? 'var(--color-surface-4)' : 'var(--color-text-faint)',
                cursor: index === priorities.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.7rem',
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { if (index !== priorities.length - 1) (e.currentTarget.style.color = 'var(--color-primary-light)'); }}
              onMouseLeave={(e) => { (e.currentTarget.style.color = index === priorities.length - 1 ? 'var(--color-surface-4)' : 'var(--color-text-faint)'); }}
            >
              ↓
            </button>
            <button
              onClick={() => onDeletePriority(priority.id)}
              title="Delete"
              style={{
                padding: '0.2rem 0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text-faint)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
