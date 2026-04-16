'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Group, Priority, Task, TaskType, UserSettings } from '@/types/index';
import { useTranslation } from '@/providers/I18nProvider';
import TaskDetailModal from '@/components/task/TaskDetailModal';
import { AnimatePresence, motion } from 'framer-motion';

type CalendarMode = 'month' | 'week';

interface TaskCalendarViewProps {
  tasks: Task[];
  groups: Group[];
  priorities: Priority[];
  taskTypes: TaskType[];
  userSettings: UserSettings | null;
  onCreateTaskAtDate: (date: string) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  const offsetFromMonday = (day + 6) % 7;
  base.setDate(base.getDate() - offsetFromMonday);
  return base;
};

const buildMonthGrid = (cursor: Date) => {
  const firstDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = getWeekStart(firstDayOfMonth);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
};

const buildWeekGrid = (cursor: Date) => {
  const start = getWeekStart(cursor);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
};

export default function TaskCalendarView({
  tasks,
  groups,
  priorities,
  taskTypes,
  userSettings,
  onCreateTaskAtDate,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
  onCreateTaskType,
}: TaskCalendarViewProps) {
  const { t, lang } = useTranslation();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const locale = lang === 'es' ? 'es-ES' : 'en-US';

  const weekdayLabels = useMemo(() => {
    const weekStart = getWeekStart(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day.toLocaleDateString(locale, { weekday: 'short' });
    });
  }, [locale]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};

    tasks
      .filter((task) => Boolean(task.dueDate))
      .forEach((task) => {
        const key = task.dueDate!;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const aPriority = priorities.find((p) => p.id === a.priorityId)?.order ?? 999;
        const bPriority = priorities.find((p) => p.id === b.priorityId)?.order ?? 999;
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aMs = a.createdAt?.toMillis?.() ?? 0;
        const bMs = b.createdAt?.toMillis?.() ?? 0;
        return bMs - aMs;
      });
    });

    return map;
  }, [tasks, priorities]);

  const visibleDays = useMemo(() => {
    return mode === 'month' ? buildMonthGrid(cursorDate) : buildWeekGrid(cursorDate);
  }, [mode, cursorDate]);

  const visibleWeekDays = useMemo(() => buildWeekGrid(cursorDate), [cursorDate]);

  const goToPrevious = () => {
    const next = new Date(cursorDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCursorDate(next);
  };

  const goToNext = () => {
    const next = new Date(cursorDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCursorDate(next);
  };

  const goToToday = () => {
    setCursorDate(new Date());
  };

  const titleLabel =
    mode === 'month'
      ? cursorDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
      : `${visibleWeekDays[0].toLocaleDateString(locale)} - ${visibleWeekDays[6].toLocaleDateString(locale)}`;

  const todayKey = formatDateKey(new Date());

  const weekGroupedByDayAndPriority = useMemo(() => {
    const result: Record<string, Record<string, Task[]>> = {};

    visibleWeekDays.forEach((day) => {
      const dayKey = formatDateKey(day);
      const dayTasks = tasksByDate[dayKey] ?? [];
      const groupsByPriority: Record<string, Task[]> = {};

      dayTasks.forEach((task) => {
        const priorityName = priorities.find((p) => p.id === task.priorityId)?.name || t('priority');
        if (!groupsByPriority[priorityName]) groupsByPriority[priorityName] = [];
        groupsByPriority[priorityName].push(task);
      });

      result[dayKey] = groupsByPriority;
    });

    return result;
  }, [visibleWeekDays, tasksByDate, priorities, t]);

  const handleDayCellClick = (event: React.MouseEvent<HTMLElement>, dayKey: string) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-task-card="true"]') || target.closest('[data-task-open="true"]')) {
      return;
    }
    onCreateTaskAtDate(dayKey);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        height: 'calc(100vh - 180px)',
        maxHeight: 'calc(100vh - 180px)',
        minHeight: '520px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.55rem 0.65rem',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={15} color="var(--color-primary-light)" />
          <strong style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>{titleLabel}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={goToPrevious} style={{ padding: '0.3rem 0.45rem' }}>
            <ChevronLeft size={15} />
          </button>
          <button className="btn btn-ghost" onClick={goToToday} style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}>
            {t('calendar_today')}
          </button>
          <button className="btn btn-ghost" onClick={goToNext} style={{ padding: '0.3rem 0.45rem' }}>
            <ChevronRight size={15} />
          </button>
          <div
            style={{
              display: 'inline-flex',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              marginLeft: '0.1rem',
            }}
          >
            <button
              className="btn btn-ghost"
              onClick={() => setMode('month')}
              style={{
                padding: '0.28rem 0.6rem',
                borderRadius: 0,
                fontSize: '0.75rem',
                background: mode === 'month' ? 'var(--color-surface-3)' : 'transparent',
              }}
            >
              {t('calendar_month')}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setMode('week')}
              style={{
                padding: '0.28rem 0.6rem',
                borderRadius: 0,
                fontSize: '0.75rem',
                background: mode === 'week' ? 'var(--color-surface-3)' : 'transparent',
              }}
            >
              {t('calendar_week')}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {mode === 'month' ? (
        <motion.div
          key="calendar-month-mode"
          initial={{ opacity: 0, y: 12, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.992 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '0.45rem',
              flexShrink: 0,
            }}
          >
            {weekdayLabels.map((day, idx) => (
              <div
                key={`${day}-${idx}`}
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-faint)',
                  fontWeight: 700,
                  paddingLeft: '0.25rem',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '0.45rem',
              overflowY: 'auto',
              paddingRight: '0.25rem',
              flex: 1,
            }}
          >
            {visibleDays.map((day) => {
              const dayKey = formatDateKey(day);
              const dayTasks = tasksByDate[dayKey] ?? [];
              const inCurrentMonth = day.getMonth() === cursorDate.getMonth();

              return (
                <motion.div
                  key={dayKey}
                  onClick={(event) => handleDayCellClick(event, dayKey)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min((day.getDate() % 10) * 0.008, 0.08) }}
                  style={{
                    minHeight: '118px',
                    background: 'var(--color-surface-1)',
                    border: `1px solid ${dayKey === todayKey ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem',
                    opacity: !inCurrentMonth ? 0.45 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: dayKey === todayKey ? 800 : 600,
                      color: dayKey === todayKey ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    }}
                  >
                    {day.getDate()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                    {dayTasks.slice(0, 3).map((task) => {
                      const group = groups.find((g) => g.id === task.groupId);
                      const priority = priorities.find((p) => p.id === task.priorityId);

                      return (
                        <div
                          key={task.id}
                          data-task-card="true"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '0.22rem 0.3rem',
                            fontSize: '0.65rem',
                            color: task.completed ? 'var(--color-text-faint)' : 'var(--color-text-base)',
                            opacity: task.completed ? 0.7 : 1,
                          }}
                        >
                          <span
                            style={{
                              width: '0.38rem',
                              height: '0.38rem',
                              borderRadius: '50%',
                              background: priority?.color || 'var(--color-primary-light)',
                              flexShrink: 0,
                            }}
                          />
                          <button
                            type="button"
                            data-task-open="true"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTask(task);
                            }}
                            title={t('task_detail_title')}
                            style={{
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {task.title}
                          </button>
                          {group && (
                            <span style={{ color: 'var(--color-text-faint)', fontSize: '0.6rem', flexShrink: 0 }}>
                              {group.name}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span style={{ fontSize: '0.64rem', color: 'var(--color-text-faint)', paddingLeft: '0.2rem' }}>
                        {t('and_more', { count: dayTasks.length - 3 })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="calendar-week-mode"
          initial={{ opacity: 0, y: 12, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.992 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(190px, 1fr))',
            gap: '0.5rem',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '0.35rem',
            flex: 1,
            minHeight: 0,
          }}
        >
          {visibleWeekDays.map((day, idx) => {
            const dayKey = formatDateKey(day);
            const groupedByPriority = weekGroupedByDayAndPriority[dayKey] || {};
            const priorityNames = Object.keys(groupedByPriority);

            return (
              <motion.div
                key={dayKey}
                onClick={(event) => handleDayCellClick(event, dayKey)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: idx * 0.03 }}
                style={{
                  background: 'var(--color-surface-1)',
                  border: `1px solid ${dayKey === todayKey ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  maxHeight: '100%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    padding: '0.45rem 0.55rem',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {weekdayLabels[idx]}
                  </div>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: dayKey === todayKey ? 800 : 700,
                      color: dayKey === todayKey ? 'var(--color-primary-light)' : 'var(--color-text-base)',
                    }}
                  >
                    {day.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div style={{ padding: '0.45rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {priorityNames.length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                      {t('no_tasks_in_group')}
                    </div>
                  ) : (
                    priorityNames.map((priorityName) => {
                      const tasksInPriority = groupedByPriority[priorityName];

                      return (
                        <div key={`${dayKey}-${priorityName}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-faint)', fontWeight: 700 }}>
                            {priorityName}
                          </div>

                          {tasksInPriority.map((task) => {
                            const group = groups.find((g) => g.id === task.groupId);
                            const taskType = task.typeId ? taskTypes.find((tt) => tt.id === task.typeId) : null;
                            const priority = priorities.find((p) => p.id === task.priorityId);

                            return (
                              <div
                                key={task.id}
                                data-task-card="true"
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  gap: '0.28rem',
                                  background: 'var(--color-surface-2)',
                                  border: '1px solid var(--color-border)',
                                  borderLeft: `3px solid ${priority?.color || 'var(--color-primary-light)'}`,
                                  borderRadius: '7px',
                                  padding: '0.35rem 0.42rem',
                                  opacity: task.completed ? 0.68 : 1,
                                }}
                              >
                                <div
                                  style={{ width: '100%' }}
                                >
                                  <button
                                    type="button"
                                    data-task-open="true"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedTask(task);
                                    }}
                                    title={t('task_detail_title')}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      color: task.completed ? 'var(--color-text-faint)' : 'var(--color-text-base)',
                                      textDecoration: task.completed ? 'line-through' : 'none',
                                      width: '100%',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      textAlign: 'left',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: 0,
                                    }}
                                  >
                                    {task.title}
                                  </button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  {group && (
                                    <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)' }}>
                                      {group.name}
                                    </span>
                                  )}
                                  {taskType && (
                                    <span style={{ fontSize: '0.62rem', color: taskType.color || 'var(--color-primary-light)' }}>
                                      {taskType.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>

      {tasks.filter((task) => !task.dueDate).length > 0 && (
        <div
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.9rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
            {t('calendar_tasks_without_due_date')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {tasks
              .filter((task) => !task.dueDate)
              .slice(0, 14)
              .map((task) => (
                <span
                  key={task.id}
                  style={{
                    fontSize: '0.72rem',
                    color: task.completed ? 'var(--color-text-faint)' : 'var(--color-text-muted)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '999px',
                    padding: '0.2rem 0.55rem',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
              ))}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          priorities={priorities}
          groups={groups}
          taskTypes={taskTypes}
          userSettings={userSettings}
          onClose={() => setSelectedTask(null)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onToggle={onToggleTask}
          onCreateTaskType={onCreateTaskType}
        />
      )}
    </div>
  );
}
