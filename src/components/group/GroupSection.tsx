'use client';

import { useState } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { Priority, Group, Task, UserSettings } from '@/types/index';
import TaskItem from '@/components/task/TaskItem';

interface GroupSectionProps {
  priorities: Priority[];
  groups: Group[];
  userSettings: UserSettings | null;
  group: Group;
  tasks: Task[];
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
}

export default function GroupSection({
  priorities,
  groups,
  userSettings,
  group,
  tasks,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
}: GroupSectionProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const color = group.color || 'var(--color-primary)';

  return (
    <div style={{
      background: 'var(--color-surface-0)',
      border: '1px solid var(--color-border)',
      borderLeft: `2px solid ${color}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: 'var(--color-surface-1)',
          borderBottom: (!collapsed && tasks.length > 0) ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            {group.name}
          </span>
        </div>
        {tasks.length > 0 && (
          <span className="badge">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
        )}
      </div>

      {/* Tasks */}
      {!collapsed && (
        tasks.length > 0 ? (
          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                priorities={priorities}
                groups={groups}
                userSettings={userSettings}
                task={task}
                onDelete={onDeleteTask}
                onToggle={onToggleTask}
                onUpdate={onUpdateTask}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
              {t('no_tasks_in_group')}
            </p>
          </div>
        )
      )}
    </div>
  );
}
