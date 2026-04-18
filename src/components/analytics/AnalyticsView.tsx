'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Group, Priority, Task, TaskType } from '@/types/index';
import { useTranslation } from '@/providers/I18nProvider';
import { useAnalytics, AnalyticsRange } from './useAnalytics';
import { Group as VisxGroup } from '@visx/group';
import { Pie, LinePath } from '@visx/shape';
import { scaleBand, scaleLinear, scalePoint } from '@visx/scale';
import { Text } from '@visx/text';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GripVertical,
  Layers3,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  isMobile: boolean;
}

type WidgetId =
  | 'summary'
  | 'completionSplit'
  | 'groups'
  | 'priorities'
  | 'types'
  | 'backlog'
  | 'quality'
  | 'weekday'
  | 'forecast'
  | 'pressure'
  | 'priorityHealth';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
}

interface RowItem {
  label: string;
  value: number;
  color?: string;
  helper?: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'summary', visible: true },
  { id: 'completionSplit', visible: true },
  { id: 'groups', visible: true },
  { id: 'priorities', visible: true },
  { id: 'types', visible: true },
  { id: 'backlog', visible: true },
  { id: 'quality', visible: true },
  { id: 'weekday', visible: true },
  { id: 'forecast', visible: true },
  { id: 'pressure', visible: true },
  { id: 'priorityHealth', visible: true },
];

const CHART_COLORS = {
  completed: 'var(--color-success)',
  pending: 'var(--color-accent)',
  created: 'var(--color-primary-light)',
  projected: 'var(--color-accent-light)',
};

function WidgetCard({
  title,
  visible,
  onToggleVisible,
  isMobile,
  visibleLabel,
  hiddenLabel,
  hiddenMessage,
  hideToggle = false,
  compact = false,
  children,
}: {
  title: string;
  visible: boolean;
  onToggleVisible: () => void;
  isMobile: boolean;
  visibleLabel: string;
  hiddenLabel: string;
  hiddenMessage: string;
  hideToggle?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  const shellStyle = compact
    ? {
        padding: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }
    : { padding: '1rem', position: 'relative' as const };

  return (
    <article className={compact ? undefined : 'card'} style={shellStyle}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h3>
          {!hideToggle && (
            <button
              type="button"
              onClick={onToggleVisible}
              className="btn btn-ghost"
              style={{
                width: '2rem',
                height: '2rem',
                padding: 0,
                border: 'none',
                borderRadius: '999px',
                background: visible ? 'var(--color-surface-2)' : 'rgba(239,68,68,0.08)',
                color: visible ? 'var(--color-text-muted)' : 'var(--color-danger)',
                flexShrink: 0,
              }}
            >
              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          )}
        </div>
      )}
      {visible ? children : (
        <div style={{ padding: compact ? '0.25rem 0' : '1rem 0.25rem 0.35rem', color: 'var(--color-text-faint)', fontSize: '0.82rem', borderTop: compact ? 'none' : '1px dashed var(--color-border)' }}>
          {hiddenMessage}
        </div>
      )}
    </article>
  );
}

const SectionCard = WidgetCard;

function SortableWidgetFrame({
  id,
  title,
  visible,
  onToggleVisible,
  isMobile,
  visibleLabel,
  hiddenLabel,
  hiddenMessage,
  children,
}: {
  id: WidgetId;
  title: string;
  visible: boolean;
  onToggleVisible: (id: WidgetId) => void;
  isMobile: boolean;
  visibleLabel: string;
  hiddenLabel: string;
  hiddenMessage: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        minWidth: 0,
      }}
    >
      <article className="card" style={{ padding: '0.95rem 1rem 1rem', position: 'relative', height: '100%', background: 'var(--color-surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.8rem' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{title}</h3>
              {!visible && (
                <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)', borderRadius: '999px', padding: '0.16rem 0.4rem' }}>
                  {hiddenLabel}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', marginTop: '0.12rem' }}>{visible ? visibleLabel : hiddenLabel}</div>
          </div>
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${title}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? 36 : 30,
              height: isMobile ? 36 : 30,
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: isDragging ? 'grabbing' : 'grab',
              flexShrink: 0,
            }}
          >
            <GripVertical size={14} />
          </button>
        </div>
        {!visible ? (
          <div style={{ padding: '0.6rem 0.1rem 0', color: 'var(--color-text-faint)', fontSize: '0.82rem', borderTop: '1px solid var(--color-border)', opacity: 0.9 }}>
            {hiddenMessage}
          </div>
        ) : (
          <div style={{ minWidth: 0 }}>{children}</div>
        )}
        <button
          type="button"
          onClick={() => onToggleVisible(id)}
          style={{
            position: 'absolute',
            top: '0.88rem',
            right: isMobile ? '2.8rem' : '2.95rem',
            width: '2rem',
            height: '2rem',
            padding: 0,
            border: 'none',
            borderRadius: '999px',
            background: visible ? 'transparent' : 'rgba(239,68,68,0.08)',
            color: visible ? 'var(--color-text-muted)' : 'var(--color-danger)',
            flexShrink: 0,
          }}
        >
          {visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </article>
    </div>
  );
}

function KpiCard({ title, value, helper, icon }: { title: string; value: string | number; helper: string; icon: ReactNode; }) {
  return (
    <article className="card" style={{ padding: '0.95rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', minHeight: '118px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{helper}</div>
    </article>
  );
}

function CompletionDonut({ completed, pending, total, title, isMobile, t, compact = false }: { completed: number; pending: number; total: number; title: string; isMobile: boolean; t: (key: string) => string; compact?: boolean; }) {
  const data = [
    { label: t('analytics_completed_short'), value: completed, color: CHART_COLORS.completed },
    { label: t('analytics_pending_short'), value: pending, color: CHART_COLORS.pending },
  ];
  const size = isMobile ? 188 : 220;
  const radius = isMobile ? 66 : 82;

  return (
    <article className={compact ? undefined : 'card'} style={compact ? { padding: 0 } : { padding: '1rem' }}>
      {!compact && <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h3>}
      <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
        <VisxGroup top={size / 2} left={size / 2}>
          <Pie data={data} pieValue={(d) => d.value} outerRadius={radius} innerRadius={radius - (isMobile ? 22 : 28)} padAngle={0.02}>
            {(pie) => pie.arcs.map((arc) => (
              <path key={arc.data.label} d={pie.path(arc) || ''} fill={arc.data.color} stroke="var(--color-surface-1)" strokeWidth={2} />
            ))}
          </Pie>
          <Text textAnchor="middle" verticalAnchor="middle" dy={-8} fill="var(--color-text-base)" style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800 }}>{total}</Text>
          <Text textAnchor="middle" verticalAnchor="middle" dy={16} fill="var(--color-text-muted)" style={{ fontSize: 12 }}>{t('analytics_tasks')}</Text>
        </VisxGroup>
      </svg>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS.completed, marginRight: 6 }} />
          {completed} {t('analytics_completed_short')}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS.pending, marginRight: 6 }} />
          {pending} {t('analytics_pending_short')}
        </span>
      </div>
    </article>
  );
}

function HorizontalBarsCard({ title, rows, isMobile, emptyText, compact = false }: { title: string; rows: RowItem[]; isMobile: boolean; emptyText: string; compact?: boolean; }) {
  const width = 520;
  const rowHeight = isMobile ? 28 : 32;
  const margin = { top: 10, right: 16, bottom: 10, left: isMobile ? 100 : 142 };
  const height = Math.max(rows.length * rowHeight + margin.top + margin.bottom, isMobile ? 170 : 240);
  const maxValue = Math.max(1, ...rows.map((r) => r.value));
  const xScale = scaleLinear<number>({ domain: [0, maxValue], range: [0, width - margin.left - margin.right] });
  const yScale = scaleBand<string>({ domain: rows.map((r) => r.label), range: [0, rows.length * rowHeight], padding: 0.3 });

  return (
    <article className={compact ? undefined : 'card'} style={compact ? { padding: 0 } : { padding: '1rem' }}>
      {!compact && <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.65rem' }}>{title}</h3>}
      {rows.length === 0 ? (
        <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>{emptyText}</div>
      ) : (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMin meet">
          <VisxGroup top={margin.top} left={margin.left}>
            {rows.map((row) => {
              const y = yScale(row.label) ?? 0;
              const barWidth = xScale(row.value);
              return (
                <g key={row.label} transform={`translate(0, ${y})`}>
                  <rect x={0} y={0} width={Math.max(8, barWidth)} height={yScale.bandwidth()} rx={8} fill={row.color || CHART_COLORS.created} opacity={0.9} />
                  <Text x={-8} y={yScale.bandwidth() / 2} textAnchor="end" verticalAnchor="middle" fill="var(--color-text-muted)" style={{ fontSize: isMobile ? 11 : 12 }}>{row.label}</Text>
                  {row.helper && !isMobile && (
                    <Text x={-8} y={yScale.bandwidth() / 2 + 12} textAnchor="end" verticalAnchor="middle" fill="var(--color-text-faint)" style={{ fontSize: 10 }}>{row.helper}</Text>
                  )}
                  <Text x={barWidth + 8} y={yScale.bandwidth() / 2} textAnchor="start" verticalAnchor="middle" fill="var(--color-text-base)" style={{ fontSize: 12, fontWeight: 700 }}>{row.value}</Text>
                </g>
              );
            })}
          </VisxGroup>
        </svg>
      )}
    </article>
  );
}

function WeekdayLoadChart({ title, rows, isMobile, compact = false }: { title: string; rows: Array<{ label: string; value: number }>; isMobile: boolean; compact?: boolean; }) {
  const width = 520;
  const height = isMobile ? 200 : 240;
  const margin = { top: 16, right: 14, bottom: 28, left: 28 };
  const xScale = scaleBand<string>({ domain: rows.map((r) => r.label), range: [margin.left, width - margin.right], padding: 0.3 });
  const maxValue = Math.max(1, ...rows.map((r) => r.value));
  const yScale = scaleLinear<number>({ domain: [0, maxValue], range: [height - margin.bottom, margin.top] });

  return (
    <article className={compact ? undefined : 'card'} style={compact ? { padding: 0 } : { padding: '1rem' }}>
      {!compact && <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.65rem' }}>{title}</h3>}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMin meet">
        {rows.map((row) => {
          const x = xScale(row.label) ?? 0;
          const y = yScale(row.value);
          return (
            <g key={row.label}>
              <rect x={x} y={y} width={xScale.bandwidth()} height={height - margin.bottom - y} rx={8} fill="var(--color-primary-light)" opacity={0.92} />
              <Text x={x + xScale.bandwidth() / 2} y={height - 10} textAnchor="middle" fill="var(--color-text-muted)" style={{ fontSize: 11 }}>{row.label}</Text>
              <Text x={x + xScale.bandwidth() / 2} y={y - 6} textAnchor="middle" fill="var(--color-text-base)" style={{ fontSize: 11, fontWeight: 700 }}>{row.value}</Text>
            </g>
          );
        })}
      </svg>
    </article>
  );
}

function ForecastChart({ title, rows, isMobile, t, compact = false }: { title: string; rows: Array<{ label: string; created: number; completed: number; forecast: boolean }>; isMobile: boolean; t: (key: string) => string; compact?: boolean; }) {
  const width = 520;
  const height = isMobile ? 220 : 280;
  const margin = { top: 18, right: 18, bottom: 30, left: 26 };
  const xScale = scalePoint<string>({ domain: rows.map((r) => r.label), range: [margin.left, width - margin.right], padding: 0.4 });
  const maxValue = Math.max(1, ...rows.flatMap((r) => [r.created, r.completed]));
  const yScale = scaleLinear<number>({ domain: [0, maxValue], range: [height - margin.bottom, margin.top] });

  const actualRows = rows.filter((row) => !row.forecast);
  const forecastRows = rows.filter((row) => row.forecast);
  const forecastLine = actualRows.length > 0 && forecastRows.length > 0 ? [actualRows[actualRows.length - 1], ...forecastRows] : forecastRows;
  const projectedCompleted = forecastRows.reduce((acc, row) => acc + row.completed, 0);
  const projectedCreated = forecastRows.reduce((acc, row) => acc + row.created, 0);

  return (
    <article className={compact ? undefined : 'card'} style={compact ? { padding: 0 } : { padding: '1rem' }}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{title}</h3>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)' }}>
            {t('analytics_projection')}: <strong style={{ color: 'var(--color-text-base)' }}>{projectedCompleted}</strong>
          </div>
        </div>
      )}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMin meet">
        <LinePath data={actualRows} x={(d) => xScale(d.label) ?? margin.left} y={(d) => yScale(d.completed)} stroke={CHART_COLORS.created} strokeWidth={2.6} />
        <LinePath data={forecastLine} x={(d) => xScale(d.label) ?? margin.left} y={(d) => yScale(d.completed)} stroke={CHART_COLORS.projected} strokeWidth={2.6} strokeDasharray="7 5" />
        {rows.map((row) => {
          const x = xScale(row.label) ?? margin.left;
          const isForecast = row.forecast;
          return (
            <g key={row.label}>
              <circle cx={x} cy={yScale(row.completed)} r={isForecast ? 3 : 3.6} fill={isForecast ? CHART_COLORS.projected : CHART_COLORS.created} opacity={isForecast ? 0.9 : 1} />
              <Text x={x} y={height - 11} textAnchor="middle" fill="var(--color-text-muted)" style={{ fontSize: 10.5 }}>{row.label}</Text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: CHART_COLORS.created, marginRight: 6 }} />{t('analytics_actual')}</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: CHART_COLORS.projected, marginRight: 6 }} />{t('analytics_projected')}</span>
        <span>{t('analytics_created_next')}: <strong style={{ color: 'var(--color-text-base)' }}>{projectedCreated}</strong></span>
      </div>
    </article>
  );
}

export default function AnalyticsView({ tasks, priorities, groups, taskTypes, isMobile }: AnalyticsViewProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const analytics = useAnalytics(tasks, priorities, groups, taskTypes, range);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } }),
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem('taskflow.analytics.widgets');
      if (!saved) return;
      const parsed = JSON.parse(saved) as WidgetConfig[];
      if (!Array.isArray(parsed)) return;
      const known = new Set(DEFAULT_WIDGETS.map((widget) => widget.id));
      const normalized = parsed
        .filter((widget) => known.has(widget.id))
        .map((widget) => ({
          id: widget.id,
          visible: typeof widget.visible === 'boolean' ? widget.visible : true,
        }));
      const missing = DEFAULT_WIDGETS.filter((widget) => !normalized.some((item) => item.id === widget.id));
      setWidgets([...normalized, ...missing]);
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskflow.analytics.widgets', JSON.stringify(widgets));
  }, [widgets]);

  const scopeLabel = useMemo(() => {
    if (range === '7d') return t('analytics_range_7d');
    if (range === '30d') return t('analytics_range_30d');
    if (range === '90d') return t('analytics_range_90d');
    return t('analytics_range_all');
  }, [range, t]);

  const widgetTitles: Record<WidgetId, string> = {
    summary: t('analytics_summary'),
    completionSplit: t('analytics_completion_split'),
    groups: t('analytics_group_distribution'),
    priorities: t('analytics_priority_distribution'),
    types: t('analytics_task_type_distribution'),
    backlog: t('analytics_backlog_aging'),
    quality: t('analytics_quality_mix'),
    weekday: t('analytics_weekday_load'),
    forecast: t('analytics_forecast'),
    pressure: t('analytics_groups_pressure'),
    priorityHealth: t('analytics_priority_health'),
  };

  const orderedWidgets = widgets.filter((widget) => widget.visible || isCustomizing);
  const visibleLabel = t('analytics_visible');
  const hiddenLabel = t('analytics_hidden');
  const hiddenMessage = t('analytics_hidden_message');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((current) => {
      const oldIndex = current.findIndex((widget) => widget.id === active.id);
      const newIndex = current.findIndex((widget) => widget.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const toggleWidgetVisible = (id: WidgetId) => {
    setWidgets((current) => current.map((widget) => (widget.id === id ? { ...widget, visible: !widget.visible } : widget)));
  };

  const resetWidgets = () => setWidgets(DEFAULT_WIDGETS);

  const renderWidget = (id: WidgetId, compact = false) => {
    if (id === 'summary') {
      if (compact) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
            <KpiCard title={t('analytics_total_tasks')} value={analytics.kpis.total} helper={t('analytics_scope_tasks')} icon={<Layers3 size={16} />} />
            <KpiCard title={t('analytics_completion_rate')} value={`${analytics.kpis.completionRate}%`} helper={`${analytics.kpis.completed} ${t('analytics_completed_short')}`} icon={<CheckCircle2 size={16} />} />
            <KpiCard title={t('analytics_overdue')} value={analytics.kpis.overdue} helper={`${analytics.kpis.dueSoon} ${t('analytics_due_soon')}`} icon={<AlertTriangle size={16} />} />
            <KpiCard title={t('analytics_without_due_date')} value={analytics.kpis.withoutDueDate} helper={`${analytics.kpis.pending} ${t('analytics_pending_short')}`} icon={<Clock3 size={16} />} />
          </div>
        );
      }

      return (
        <SectionCard
          key={id}
          title={widgetTitles[id]}
          visible={true}
          onToggleVisible={() => toggleWidgetVisible(id)}
          isMobile={isMobile}
          visibleLabel={visibleLabel}
          hiddenLabel={hiddenLabel}
          hiddenMessage={hiddenMessage}
          hideToggle={compact}
        >
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
            <KpiCard title={t('analytics_total_tasks')} value={analytics.kpis.total} helper={t('analytics_scope_tasks')} icon={<Layers3 size={16} />} />
            <KpiCard title={t('analytics_completion_rate')} value={`${analytics.kpis.completionRate}%`} helper={`${analytics.kpis.completed} ${t('analytics_completed_short')}`} icon={<CheckCircle2 size={16} />} />
            <KpiCard title={t('analytics_overdue')} value={analytics.kpis.overdue} helper={`${analytics.kpis.dueSoon} ${t('analytics_due_soon')}`} icon={<AlertTriangle size={16} />} />
            <KpiCard title={t('analytics_without_due_date')} value={analytics.kpis.withoutDueDate} helper={`${analytics.kpis.pending} ${t('analytics_pending_short')}`} icon={<Clock3 size={16} />} />
          </div>
        </SectionCard>
      );
    }

    if (id === 'completionSplit') {
      return <CompletionDonut key={id} completed={analytics.kpis.completed} pending={analytics.kpis.pending} total={analytics.kpis.total} title={widgetTitles[id]} isMobile={isMobile} t={t} compact={compact} />;
    }

    if (id === 'groups') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.groupDistribution.slice(0, 6)} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    if (id === 'priorities') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.priorityDistribution.slice(0, 6)} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    if (id === 'types') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.taskTypeDistribution.slice(0, 6)} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    if (id === 'backlog') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.backlogBuckets.map((bucket) => ({ label: bucket.label, value: bucket.value, color: bucket.color }))} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    if (id === 'quality') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.qualityMix.map((row) => ({ label: row.label, value: row.value, color: row.color }))} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    if (id === 'weekday') {
      return <WeekdayLoadChart key={id} title={widgetTitles[id]} rows={analytics.weekdayLoad} isMobile={isMobile} compact={compact} />;
    }

    if (id === 'forecast') {
      return <ForecastChart key={id} title={widgetTitles[id]} rows={analytics.forecastByWeek} isMobile={isMobile} t={t} compact={compact} />;
    }

    if (id === 'pressure') {
      if (compact) {
        return (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {analytics.groupPressure.map((row, idx) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '28px 1.5fr 90px 90px 110px 110px', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--color-text-faint)' }}>#{idx + 1}</strong>
                <strong>{row.name}</strong>
                {!isMobile && <span>{t('analytics_score')}: <strong>{row.score}</strong></span>}
                {!isMobile && <span>{t('analytics_open')}: <strong>{row.openLoad}</strong></span>}
                {!isMobile && <span>{t('analytics_overdue_weighted')}: <strong>{row.overdueWeighted}</strong></span>}
                <span>{t('analytics_completion_short')}: <strong>{row.completionRate}%</strong></span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <article className="card" key={id} style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{widgetTitles[id]}</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <TriangleAlert size={13} /> {t('analytics_hotspots')}
            </span>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {analytics.groupPressure.map((row, idx) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '28px 1.5fr 90px 90px 110px 110px', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--color-text-faint)' }}>#{idx + 1}</strong>
                <strong>{row.name}</strong>
                {!isMobile && <span>{t('analytics_score')}: <strong>{row.score}</strong></span>}
                {!isMobile && <span>{t('analytics_open')}: <strong>{row.openLoad}</strong></span>}
                {!isMobile && <span>{t('analytics_overdue_weighted')}: <strong>{row.overdueWeighted}</strong></span>}
                <span>{t('analytics_completion_short')}: <strong>{row.completionRate}%</strong></span>
              </div>
            ))}
            {analytics.groupPressure.length === 0 && <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>{t('analytics_no_data')}</div>}
          </div>
        </article>
      );
    }

    if (id === 'priorityHealth') {
      return <HorizontalBarsCard key={id} title={widgetTitles[id]} rows={analytics.priorityHealth.map((row) => ({ label: row.label, value: row.value, color: row.color, helper: `${row.open} ${t('analytics_open_short')} • ${row.completionRate}% ${t('analytics_completed_short')}` }))} isMobile={isMobile} emptyText={t('analytics_no_data')} compact={compact} />;
    }

    return null;
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: isMobile ? '0.95rem' : '0.95rem 1rem', display: 'grid', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 800 }}>
              <BarChart3 size={18} /> {t('analytics_title')}
            </h2>
            <p style={{ marginTop: '0.2rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', maxWidth: '58ch' }}>
              {t('analytics_subtitle')} - {scopeLabel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsCustomizing((prev) => !prev)}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.38rem 0.65rem', background: isCustomizing ? 'var(--color-surface-3)' : 'var(--color-surface-2)', color: isCustomizing ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}
            >
              <Sparkles size={14} />
              {t('analytics_customize')}
            </button>
            <button
              type="button"
              onClick={resetWidgets}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.38rem 0.65rem', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              <RotateCcw size={14} />
              {t('analytics_reset_layout')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '0.2rem' : 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['7d', '30d', '90d', 'all'] as AnalyticsRange[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setRange(candidate)}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', background: range === candidate ? 'var(--color-surface-3)' : 'var(--color-surface-2)', color: range === candidate ? 'var(--color-primary-light)' : 'var(--color-text-muted)', flexShrink: 0 }}
            >
              {candidate === 'all' ? t('analytics_range_all') : candidate.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isCustomizing && (
        <article className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('analytics_customize_title')}</h3>
              <p style={{ marginTop: '0.15rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{t('analytics_customize_desc')}</p>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', padding: '0.35rem 0.55rem', borderRadius: '999px', background: 'var(--color-surface-2)' }}>{t('analytics_drag_hint')}</div>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                {widgets.map((widget) => (
                  <SortableWidgetFrame
                    key={widget.id}
                    id={widget.id}
                    title={widgetTitles[widget.id]}
                    visible={widget.visible}
                    onToggleVisible={toggleWidgetVisible}
                    isMobile={isMobile}
                    visibleLabel={visibleLabel}
                    hiddenLabel={hiddenLabel}
                    hiddenMessage={hiddenMessage}
                  >
                    {renderWidget(widget.id, true)}
                  </SortableWidgetFrame>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </article>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
        {orderedWidgets.map((widget) => {
          if (!widget.visible && !isCustomizing) return null;
          return (
            <div key={widget.id} style={{ minWidth: 0 }}>
              {renderWidget(widget.id, false)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
