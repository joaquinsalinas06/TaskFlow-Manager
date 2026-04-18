import { useMemo } from 'react';
import { Group, Priority, Task, TaskType } from '@/types/index';

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsKpis {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  overdue: number;
  dueSoon: number;
  withoutDueDate: number;
  withChecklist: number;
  withLinks: number;
  withCalendar: number;
  withReminder: number;
}

export interface SeriesDatum {
  label: string;
  value: number;
  color?: string;
}

export interface WeekSeriesDatum {
  label: string;
  created: number;
  completed: number;
}

export interface PriorityHealthDatum {
  id: string;
  label: string;
  value: number;
  completed: number;
  open: number;
  completionRate: number;
  overdueWeighted: number;
  color?: string;
}

export interface ForecastDatum {
  label: string;
  created: number;
  completed: number;
  forecast: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseDueDate = (dueDate: string | null | undefined): Date | null => {
  if (!dueDate) return null;
  const parsed = new Date(`${dueDate}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getRangeStart = (range: AnalyticsRange, now: Date): Date | null => {
  if (range === 'all') return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  d.setDate(d.getDate() - (days - 1));
  return d;
};

const inRange = (task: Task, start: Date | null) => {
  if (!start) return true;
  const created = task.createdAt?.toDate?.();
  const completedAt = task.completedAt?.toDate?.();
  const due = parseDueDate(task.dueDate);

  const timelineDates = [completedAt, due, created].filter(Boolean) as Date[];
  if (timelineDates.length === 0) return false;

  return timelineDates.some((date) => startOfDay(date) >= start);
};

const getWeekKey = (date: Date) => {
  const d = startOfDay(date);
  const jsDay = d.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + mondayOffset);
  return d.toISOString().slice(0, 10);
};

const formatWeek = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
};

const linearForecast = (values: number[], count: number) => {
  if (values.length === 0) {
    return Array.from({ length: count }, () => 0);
  }

  const n = values.length;
  const sumX = values.reduce((acc, _value, index) => acc + index, 0);
  const sumY = values.reduce((acc, value) => acc + value, 0);
  const sumXY = values.reduce((acc, value, index) => acc + index * value, 0);
  const sumXX = values.reduce((acc, _value, index) => acc + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return Array.from({ length: count }, (_, index) => {
    const x = n + index;
    return Math.max(0, Math.round(intercept + slope * x));
  });
};

export function useAnalytics(tasks: Task[], priorities: Priority[], groups: Group[], taskTypes: TaskType[], range: AnalyticsRange) {
  return useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(dueSoonDate.getDate() + 7);

    const rangeStart = getRangeStart(range, now);
    const scoped = tasks.filter((task) => inRange(task, rangeStart));

    const completed = scoped.filter((t) => t.completed);
    const pending = scoped.filter((t) => !t.completed);

    const kpis: AnalyticsKpis = {
      total: scoped.length,
      completed: completed.length,
      pending: pending.length,
      completionRate: scoped.length > 0 ? Math.round((completed.length / scoped.length) * 100) : 0,
      overdue: pending.filter((t) => {
        const due = parseDueDate(t.dueDate);
        return !!due && due < today;
      }).length,
      dueSoon: pending.filter((t) => {
        const due = parseDueDate(t.dueDate);
        return !!due && due >= today && due <= dueSoonDate;
      }).length,
      withoutDueDate: scoped.filter((t) => !t.dueDate).length,
      withChecklist: scoped.filter((t) => (t.checklistItems?.length ?? 0) > 0).length,
      withLinks: scoped.filter((t) => (t.links?.length ?? 0) > 0).length,
      withCalendar: scoped.filter((t) => !!t.addToCalendar || !!t.calendarEventId).length,
      withReminder: scoped.filter((t) => !!t.sendEmailReminder).length,
    };

    const completionSplit: SeriesDatum[] = [
      { label: 'completed', value: kpis.completed, color: '#22c55e' },
      { label: 'pending', value: kpis.pending, color: '#f59e0b' },
    ];

    const groupDistribution: SeriesDatum[] = groups.map((group) => {
      const count = scoped.filter((task) => task.groupId === group.id).length;
      return {
        label: group.name,
        value: count,
        color: group.color || '#6366f1',
      };
    }).sort((a, b) => b.value - a.value);

    const priorityDistribution: SeriesDatum[] = priorities.map((priority) => {
      const count = scoped.filter((task) => task.priorityId === priority.id).length;
      return {
        label: priority.name,
        value: count,
        color: priority.color || '#6366f1',
      };
    }).sort((a, b) => b.value - a.value);

    const weekdayLoad: SeriesDatum[] = DAY_LABELS.map((label) => ({ label, value: 0 }));
    pending.forEach((task) => {
      const due = parseDueDate(task.dueDate);
      if (!due) return;
      const jsDay = due.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      weekdayLoad[idx].value += 1;
    });

    const weeklyMap = new Map<string, { created: number; completed: number }>();
    scoped.forEach((task) => {
      const created = task.createdAt?.toDate?.();
      if (created) {
        const key = getWeekKey(created);
        const prev = weeklyMap.get(key) || { created: 0, completed: 0 };
        prev.created += 1;
        weeklyMap.set(key, prev);
      }

      if (task.completed) {
        const completedAt = task.completedAt?.toDate?.() || created;
        if (completedAt) {
          const key = getWeekKey(completedAt);
          const prev = weeklyMap.get(key) || { created: 0, completed: 0 };
          prev.completed += 1;
          weeklyMap.set(key, prev);
        }
      }
    });

    const actualWeeks = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([iso, values]) => ({
        iso,
        label: formatWeek(iso),
        created: values.created,
        completed: values.completed,
      }));

    const completedTrend = linearForecast(actualWeeks.map((week) => week.completed), 4);
    const createdTrend = linearForecast(actualWeeks.map((week) => week.created), 4);
    const futureWeekLabels = Array.from({ length: 4 }, (_, index) => {
      const baseDate = actualWeeks.length > 0
        ? new Date(`${actualWeeks[actualWeeks.length - 1].iso}T12:00:00`)
        : today;
      const date = new Date(baseDate);
      date.setDate(date.getDate() + (index + 1) * 7);
      return formatWeek(date.toISOString().slice(0, 10));
    });

    const forecastByWeek: ForecastDatum[] = [
      ...actualWeeks.map((week) => ({
        label: week.label,
        created: week.created,
        completed: week.completed,
        forecast: false,
      })),
      ...futureWeekLabels.map((label, index) => ({
        label,
        created: createdTrend[index] ?? 0,
        completed: completedTrend[index] ?? 0,
        forecast: true,
      })),
    ];

    const backlogBuckets = [
      { label: '0-3d', min: 0, max: 3, value: 0, color: 'var(--color-success)' },
      { label: '4-7d', min: 4, max: 7, value: 0, color: 'var(--color-primary-light)' },
      { label: '8-14d', min: 8, max: 14, value: 0, color: 'var(--color-accent)' },
      { label: '15-30d', min: 15, max: 30, value: 0, color: 'var(--color-danger-light)' },
      { label: '30+d', min: 31, max: Number.POSITIVE_INFINITY, value: 0, color: 'var(--color-danger)' },
      { label: 'no due', min: -1, max: -1, value: 0, color: 'var(--color-text-faint)' },
    ];

    pending.forEach((task) => {
      const created = task.createdAt?.toDate?.();
      if (!created) return;
      const ageDays = Math.floor((today.getTime() - startOfDay(created).getTime()) / 86400000);
      const bucket = backlogBuckets.find((entry) => ageDays >= entry.min && ageDays <= entry.max);
      if (bucket) {
        bucket.value += 1;
      }
    });

    const pendingWithoutDue = pending.filter((task) => !task.dueDate).length;
    backlogBuckets.find((bucket) => bucket.label === 'no due')!.value = pendingWithoutDue;

    const priorityHealth: PriorityHealthDatum[] = priorities
      .map((priority) => {
        const scopedByPriority = scoped.filter((task) => task.priorityId === priority.id);
        const completedCount = scopedByPriority.filter((task) => task.completed).length;
        const openCount = scopedByPriority.length - completedCount;
        const overdueWeighted = scopedByPriority.reduce((acc, task) => {
          if (task.completed) return acc;
          const due = parseDueDate(task.dueDate);
          if (!due || due >= today) return acc;
          const daysLate = Math.max(1, Math.floor((today.getTime() - due.getTime()) / 86400000));
          return acc + daysLate;
        }, 0);

        const completionRate = scopedByPriority.length > 0
          ? Math.round((completedCount / scopedByPriority.length) * 100)
          : 0;

        const score = Math.round(openCount * 0.45 + overdueWeighted * 0.35 + (100 - completionRate) * 0.2);

        return {
          id: priority.id,
          label: priority.name,
          value: score,
          completed: completedCount,
          open: openCount,
          completionRate,
          overdueWeighted,
          color: priority.color || 'var(--color-primary-light)',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const qualityMix: SeriesDatum[] = [
      { label: 'checklist', value: kpis.withChecklist, color: 'var(--color-primary-light)' },
      { label: 'links', value: kpis.withLinks, color: 'var(--color-accent)' },
      { label: 'calendar', value: kpis.withCalendar, color: 'var(--color-success)' },
      { label: 'reminder', value: kpis.withReminder, color: 'var(--color-danger-light)' },
    ];

    const taskTypeDistribution: SeriesDatum[] = taskTypes.map((type) => {
      const count = scoped.filter((task) => task.typeId === type.id).length;
      return {
        label: type.name,
        value: count,
        color: type.color || 'var(--color-primary-light)',
      };
    }).sort((a, b) => b.value - a.value);

    const groupPressure = groups
      .map((group) => {
        const groupPending = pending.filter((task) => task.groupId === group.id);
        const overdueWeighted = groupPending.reduce((acc, task) => {
          const due = parseDueDate(task.dueDate);
          if (!due || due >= today) return acc;
          const daysLate = Math.max(1, Math.floor((today.getTime() - due.getTime()) / 86400000));
          return acc + daysLate;
        }, 0);

        const completionRate = scoped.filter((task) => task.groupId === group.id).length > 0
          ? scoped.filter((task) => task.groupId === group.id && task.completed).length /
            scoped.filter((task) => task.groupId === group.id).length
          : 0;

        const openLoad = groupPending.length;
        const pressureScore = Math.round(overdueWeighted * 0.6 + openLoad * 0.3 + (1 - completionRate) * 10 * 0.1);

        return {
          id: group.id,
          name: group.name,
          score: pressureScore,
          overdueWeighted,
          openLoad,
          completionRate: Math.round(completionRate * 100),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      scopedTasks: scoped,
      kpis,
      completionSplit,
      groupDistribution,
      priorityDistribution,
      weekdayLoad,
      createdVsCompletedByWeek: actualWeeks,
      forecastByWeek,
      backlogBuckets,
      priorityHealth,
      qualityMix,
      taskTypeDistribution,
      groupPressure,
    };
  }, [tasks, priorities, groups, taskTypes, range]);
}
