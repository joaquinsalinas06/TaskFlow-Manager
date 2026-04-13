'use client';

import { useState } from 'react';
import { Task, Priority } from '@/types/index';
import { Calendar as CalendarIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface TaskItemProps {
  priorities: Priority[];
  task: Task;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
}

export default function TaskItem({ priorities, task, onDelete, onToggle, onUpdate }: TaskItemProps) {
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

  const changePriority = async (direction: 'up' | 'down') => {
    const currentIndex = priorities.findIndex(p => p.id === task.priorityId);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) newIndex--;
    if (direction === 'down' && currentIndex < priorities.length - 1) newIndex++;
    
    if (newIndex !== currentIndex) {
      await onUpdate(task.id, { priorityId: priorities[newIndex].id });
    }
  };

  const currentPriorityIndex = priorities.findIndex(p => p.id === task.priorityId);
  const canMoveUp = currentPriorityIndex > 0;
  const canMoveDown = currentPriorityIndex < priorities.length - 1;

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
            <CalendarIcon size={10} />
            {task.dueDate}
          </div>
        )}
      </div>

      {/* Actions container */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        {/* Move up priority */}
        <button
          onClick={() => changePriority('up')}
          disabled={!canMoveUp}
          title="Move to higher priority"
          style={{
            padding: '0.2rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'none',
            color: canMoveUp ? 'var(--color-text-faint)' : 'transparent',
            cursor: canMoveUp ? 'pointer' : 'default',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { if (canMoveUp) e.currentTarget.style.color = 'var(--color-primary-light)' }}
          onMouseLeave={(e) => { if (canMoveUp) e.currentTarget.style.color = 'var(--color-text-faint)' }}
        >
          {canMoveUp && <ChevronUp size={14} />}
        </button>

        {/* Move down priority */}
        <button
          onClick={() => changePriority('down')}
          disabled={!canMoveDown}
          title="Move to lower priority"
          style={{
            padding: '0.2rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'none',
            color: canMoveDown ? 'var(--color-text-faint)' : 'transparent',
            cursor: canMoveDown ? 'pointer' : 'default',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { if (canMoveDown) e.currentTarget.style.color = 'var(--color-primary-light)' }}
          onMouseLeave={(e) => { if (canMoveDown) e.currentTarget.style.color = 'var(--color-text-faint)' }}
        >
          {canMoveDown && <ChevronDown size={14} />}
        </button>

        <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 0.1rem' }} />

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
            transition: 'color 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
