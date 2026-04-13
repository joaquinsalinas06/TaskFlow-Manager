'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { Priority, Group, Task, UserSettings } from '@/types/index';
import PriorityColumn from '@/components/priority/PriorityColumn';
import CustomSelect from '@/components/shared/CustomSelect';
import DatePicker from '@/components/shared/DatePicker';
import { Plus, CheckSquare, Target, ListTodo, Calendar as CalendarIcon, Mail } from 'lucide-react';

interface MainContentProps {
  priorities: Priority[];
  groups: Group[];
  groupedTasks: Record<string, Record<string, Task[]>>;
  onCreateTask: (title: string, priorityId: string, groupId: string, dueDate: string | null, sendEmailReminder: boolean | null, addToCalendar: boolean | null) => Promise<Task>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  userSettings: UserSettings | null;
}

export default function MainContent({
  priorities,
  groups,
  groupedTasks,
  onCreateTask,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
  userSettings,
}: MainContentProps) {
  const { t } = useTranslation();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriorityId, setTaskPriorityId] = useState(priorities[0]?.id || '');
  const [taskGroupId, setTaskGroupId] = useState(groups[0]?.id || '');
  const [taskSendEmail, setTaskSendEmail] = useState<boolean | null>(null);
  const [taskAddCalendar, setTaskAddCalendar] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalTasks = Object.values(groupedTasks)
    .flatMap((g) => Object.values(g))
    .flat().length;
  const completedTasks = Object.values(groupedTasks)
    .flatMap((g) => Object.values(g))
    .flat()
    .filter((t) => t.completed).length;

  const openModal = () => {
    setTaskTitle('');
    setTaskPriorityId(priorities[0]?.id || '');
    setTaskGroupId(groups[0]?.id || '');
    setError('');
    // Default toggles from user settings (null = inherit)
    setTaskSendEmail(userSettings?.emailReminders ?? null);
    setTaskAddCalendar(userSettings?.calendarIntegration ?? null);
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskPriorityId || !taskGroupId) {
      setError('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      await onCreateTask(
        taskTitle.trim(),
        taskPriorityId,
        taskGroupId,
        taskDueDate ? taskDueDate : null,
        taskDueDate ? taskSendEmail : null,
        taskDueDate ? taskAddCalendar : null,
      );
      setTaskTitle('');
      setTaskDueDate('');
      setShowTaskModal(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  if (priorities.length === 0) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: 'var(--radius-xl)',
            background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <Target size={28} color="var(--color-primary-light)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('no_priorities_yet')}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('create_first_priority')}
          </p>
        </div>
      </main>
    );
  }

  if (groups.length === 0) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: 'var(--radius-xl)',
            background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <ListTodo size={28} color="var(--color-primary-light)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('no_groups_yet')}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('create_first_group')}
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-surface-0)', position: 'relative' }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--color-surface-1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '2rem 2rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              {t('dashboard')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {priorities.length} {t('priorities').toLowerCase()}
              </span>
              <span style={{ color: 'var(--color-border)', fontSize: '1rem' }}>·</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {groups.length} {t('groups').toLowerCase()}
              </span>
              {totalTasks > 0 && (
                <>
                  <span style={{ color: 'var(--color-border)', fontSize: '1rem' }}>·</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {completedTasks}/{totalTasks} {t('tasks_done')}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={openModal} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Plus size={16} />
            {t('new_task')}
          </button>
        </div>

        {/* Priority columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 2rem 2rem' }}>
          {priorities.map((priority, i) => (
            <div key={priority.id} className="animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
              <PriorityColumn
                priorities={priorities}
                priority={priority}
                groups={groups}
                tasks={groupedTasks[priority.id] || {}}
                onDeleteTask={onDeleteTask}
                onToggleTask={onToggleTask}
                onUpdateTask={onUpdateTask}
              />
            </div>
          ))}
        </div>
      </main>

      {/* ── New Task Modal ── */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('new_task')}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowTaskModal(false)}
                aria-label={t('cancel')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {error && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.65rem 0.9rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '0.82rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="label">{t('task_title_label')}</label>
                <input
                  className="input"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={t('task_title_placeholder')}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">{t('due_date_label')}</label>
                <DatePicker 
                  value={taskDueDate === '' ? null : taskDueDate} 
                  onChange={(val) => setTaskDueDate(val || '')} 
                  placeholder={t('due_date_label')}
                />
              </div>

              {/* Notification micro-toggles — only show when due date is set */}
              {taskDueDate && (
                <div style={{
                  display: 'flex', gap: '0.75rem', padding: '0.65rem 0.85rem',
                  background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}>
                  {/* Email toggle */}
                  {userSettings?.emailReminders !== undefined && (
                    <button
                      type="button"
                      id="task-modal-email-toggle"
                      onClick={() => setTaskSendEmail((prev) => prev === null ? (userSettings?.emailReminders ?? false) : !prev)}
                      title={t('send_reminder')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.25rem 0.6rem', borderRadius: '999px',
                        border: `1.5px solid ${(taskSendEmail ?? userSettings?.emailReminders) ? '#6366f1' : 'var(--color-border)'}`,
                        background: (taskSendEmail ?? userSettings?.emailReminders) ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: (taskSendEmail ?? userSettings?.emailReminders) ? 'var(--color-primary-light)' : 'var(--color-text-faint)',
                        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <Mail size={12} />
                      {t('send_reminder')}
                    </button>
                  )}

                  {/* Calendar toggle */}
                  {userSettings?.calendarIntegration !== undefined && (
                    <button
                      type="button"
                      id="task-modal-calendar-toggle"
                      onClick={() => setTaskAddCalendar((prev) => prev === null ? (userSettings?.calendarIntegration ?? false) : !prev)}
                      title={t('add_to_calendar')}
                      disabled={!userSettings?.googleRefreshToken}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.25rem 0.6rem', borderRadius: '999px',
                        border: `1.5px solid ${(taskAddCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? '#22c55e' : 'var(--color-border)'}`,
                        background: (taskAddCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? 'rgba(34,197,94,0.1)' : 'transparent',
                        color: (taskAddCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? '#22c55e' : 'var(--color-text-faint)',
                        fontSize: '0.72rem', fontWeight: 600,
                        cursor: userSettings?.googleRefreshToken ? 'pointer' : 'not-allowed',
                        opacity: userSettings?.googleRefreshToken ? 1 : 0.5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <CalendarIcon size={12} />
                      {t('add_to_calendar')}
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label={t('priority')}
                  options={priorities.map(p => ({ value: p.id, label: p.name, color: p.color }))}
                  value={taskPriorityId}
                  onChange={setTaskPriorityId}
                />
                
                <CustomSelect
                  label={t('group')}
                  options={groups.map(g => ({ value: g.id, label: g.name, color: g.color }))}
                  value={taskGroupId}
                  onChange={setTaskGroupId}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="submit"
                  disabled={saving || !taskTitle.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {saving ? t('creating') : t('create_task')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowTaskModal(false)}
                  style={{ flex: 1 }}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
