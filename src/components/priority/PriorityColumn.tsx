'use client';

import { useState } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { Priority, Group, Task, TaskType, UserSettings } from '@/types/index';
import GroupSection from '@/components/group/GroupSection';
import { motion, AnimatePresence } from 'framer-motion';

interface PriorityColumnProps {
  priorities: Priority[];
  priority: Priority;
  groups: Group[];
  taskTypes: TaskType[];
  tasks: Record<string, Task[]>;
  userSettings: UserSettings | null;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
}

export default function PriorityColumn({
  priorities,
  priority,
  groups,
  taskTypes,
  tasks,
  userSettings,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
  onCreateTaskType,
}: PriorityColumnProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const allTasks = Object.values(tasks).flat();
  const completedCount = allTasks.filter((t) => t.completed).length;
  const total = allTasks.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  
  const groupsWithTasks = groups.filter((g) => (tasks[g.id]?.length || 0) > 0);
  const color = priority.color || '#6366f1';

  return (
    <div className="priority-card" id={`priority-${priority.id}`}>
      {/* Header */}
      <div
        className="priority-card-header"
        style={{ cursor: 'pointer' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="priority-accent-bar" style={{ background: color }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <motion.span
                animate={{ rotate: collapsed ? -90 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', display: 'inline-block' }}
              >
                ▼
              </motion.span>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-base)' }}>
                {priority.name}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge">
                {completedCount}/{total}
              </span>
            </div>
          </div>
          {total > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: 'var(--color-surface-4)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  borderRadius: '2px',
                  background: color,
                  opacity: 0.85,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', minWidth: '2.5rem', textAlign: 'right' }}>
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groupsWithTasks.length > 0 ? (
                groupsWithTasks.map((group) => (
                  <GroupSection
                    key={group.id}
                    priorities={priorities}
                    groups={groups}
                    taskTypes={taskTypes}
                    userSettings={userSettings}
                    group={group}
                    tasks={tasks[group.id] || []}
                    onDeleteTask={onDeleteTask}
                    onToggleTask={onToggleTask}
                    onUpdateTask={onUpdateTask}
                    onCreateTaskType={onCreateTaskType}
                  />
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', padding: '0.5rem 0' }}>
                  {t('no_groups_associated')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
