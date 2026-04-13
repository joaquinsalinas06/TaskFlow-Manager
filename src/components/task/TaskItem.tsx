'use client';

import { useState } from 'react';
import { Task } from '@/types/index';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
}

export default function TaskItem({ task, onDelete, onToggle }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch {
      setIsDeleting(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(task.id, task.completed || false);
    } catch {
      setIsToggling(false);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.6rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        background: hovered ? 'var(--color-surface-2)' : 'transparent',
        transition: 'background 0.15s ease',
        opacity: isDeleting ? 0.4 : 1,
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={handleToggle}
        disabled={isToggling}
        className="task-checkbox"
        aria-label={`Toggle: ${task.title}`}
      />

      {/* Text Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span
          style={{
            fontSize: '0.875rem',
            color: task.completed ? 'var(--color-text-faint)' : 'var(--color-text-base)',
            textDecoration: task.completed ? 'line-through' : 'none',
            transition: 'color 0.2s',
            cursor: 'default',
          }}
        >
          {task.title}
        </span>
        
        {task.dueDate && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            fontSize: '0.65rem', 
            color: 'var(--color-text-faint)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {task.dueDate}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete: ${task.title}`}
        style={{
          padding: '0.3rem',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: 'none',
          color: 'var(--color-text-faint)',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s, color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
