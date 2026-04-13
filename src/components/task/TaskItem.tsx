'use client';

import { useState } from 'react';
import { Task, Priority, Group, TaskType, UserSettings } from '@/types/index';
import { Calendar as CalendarIcon, Trash2, FileText, Link as LinkIcon, CheckSquare, Tag } from 'lucide-react';
import TaskDetailModal from '@/components/task/TaskDetailModal';
import { motion } from 'framer-motion';

interface TaskItemProps {
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  userSettings: UserSettings | null;
  task: Task;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
}

export default function TaskItem({ priorities, groups, taskTypes, userSettings, task, onDelete, onToggle, onUpdate, onCreateTaskType }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch {
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

  // Rich-content indicators
  const hasDescription = !!task.description;
  const hasLinks = (task.links?.length ?? 0) > 0;
  const hasChecklist = (task.checklistItems?.length ?? 0) > 0;
  const checklistDone = task.checklistItems?.filter((c) => c.done).length ?? 0;
  const checklistTotal = task.checklistItems?.length ?? 0;

  const currentType = task.typeId ? taskTypes.find(t => t.id === task.typeId) : null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ x: 2 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          padding: '0.6rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          background: hovered ? 'var(--color-surface-2)' : 'transparent',
          transition: 'background 0.2s ease',
          cursor: 'default',
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
          style={{ marginTop: '0.1rem', flexShrink: 0 }}
        />

        {/* Text Container — click opens modal */}
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', cursor: 'pointer', minWidth: 0 }}
          onClick={() => setShowDetail(true)}
        >
          <span
            style={{
              fontSize: '0.875rem',
              color: task.completed ? 'var(--color-text-faint)' : 'var(--color-text-base)',
              textDecoration: task.completed ? 'line-through' : 'none',
              transition: 'color 0.2s',
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </span>

          {/* Meta row — date + rich content indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {task.dueDate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                color: 'var(--color-text-faint)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}>
                <CalendarIcon size={10} />
                {task.dueDate}
              </div>
            )}

            {currentType && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.65rem',
                color: currentType.color || 'var(--color-primary-light)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: `${currentType.color || 'var(--color-primary-light)'}15`,
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
              }}>
                <Tag size={9} />
                {currentType.name}
              </div>
            )}

            {/* Rich content indicators */}
            {(hasDescription || hasLinks || hasChecklist) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {hasDescription && (
                  <FileText size={10} style={{ color: 'var(--color-text-faint)', opacity: 0.6 }} />
                )}
                {hasLinks && (
                  <LinkIcon size={10} style={{ color: 'var(--color-text-faint)', opacity: 0.6 }} />
                )}
                {hasChecklist && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.6rem',
                    color: checklistDone === checklistTotal ? '#22c55e' : 'var(--color-text-faint)',
                    fontWeight: 700,
                    opacity: checklistDone === checklistTotal ? 1 : 0.7,
                  }}>
                    <CheckSquare size={10} />
                    {checklistDone}/{checklistTotal}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions — shown on hover */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}>
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
      </motion.div>

      {/* Detail Modal */}
      {showDetail && (
        <TaskDetailModal
          task={task}
          priorities={priorities}
          groups={groups}
          taskTypes={taskTypes}
          userSettings={userSettings}
          onCreateTaskType={onCreateTaskType}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      )}
    </>
  );
}
