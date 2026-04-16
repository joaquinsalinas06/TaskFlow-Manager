'use client';

import { useEffect, useState } from 'react';
import { Group, Task, Priority } from '@/types/index';
import ColorPicker from '@/components/shared/ColorPicker';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X as XIcon, ChevronRight, ChevronDown, Folder } from 'lucide-react';

// ==========================================
// INDIVIDUAL SORTABLE ITEM (GROUP)
// ==========================================
function SortableGroupItem({
  group,
  groupTasks,
  tasksCollapsed,
  onToggleTasksCollapsed,
  onDeleteGroup,
  onUpdateGroup,
}: {
  group: Group;
  groupTasks: Task[];
  tasksCollapsed: boolean;
  onToggleTasksCollapsed: () => void;
  onDeleteGroup: (id: string) => void;
  onUpdateGroup: (id: string, data: Partial<Group>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const handleBlur = () => {
    setIsEditing(false);
    if (editName.trim() !== '' && editName !== group.name) {
      onUpdateGroup(group.id, { name: editName.trim() });
    } else {
      setEditName(group.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setEditName(group.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        padding: isDragging ? '0.25rem 0' : 0,
        background: isDragging ? 'var(--color-surface-2)' : 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        className="sidebar-item priority-list-row"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)'
        }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          style={{
            background: 'none',
            border: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            color: 'var(--color-surface-4)',
            display: 'flex',
            padding: 0,
          }}
          className="drag-handle"
        >
          <GripVertical size={14} />
        </button>

        <ColorPicker
          color={group.color || '#6366f1'}
          onChange={(val) => onUpdateGroup(group.id, { color: val })}
          size={10}
        />

        {/* Editable Name */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-base)',
                fontSize: '0.85rem',
                padding: '0.1rem 0.4rem',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              style={{ flex: 1, cursor: 'text', padding: '0.2rem 0' }}
              title="Click to rename"
            >
              {group.name}
            </span>
          )}
        </div>

        {/* Collapse task list toggle — only shows when there are tasks */}
        {groupTasks.length > 0 && !isDragging && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTasksCollapsed(); }}
            title={tasksCollapsed ? 'Show tasks' : 'Hide tasks'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-faint)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.1rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
          >
            {tasksCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        <button
          onClick={() => onDeleteGroup(group.id)}
          title="Delete group"
          style={{
            padding: '0.2rem 0.3rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'none',
            color: 'var(--color-text-faint)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Task Legend — collapsible */}
      {!isDragging && groupTasks.length > 0 && !tasksCollapsed && (
        <div style={{
          paddingLeft: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.1rem',
          marginBottom: '0.25rem',
          overflow: 'hidden',
        }}>
          {groupTasks.map(t => (
            <div key={t.id} style={{
              fontSize: '0.7rem',
              color: t.completed ? 'var(--color-text-faint)' : 'var(--color-text-faint)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: t.completed ? 0.5 : 0.75,
            }}>
              <span style={{ color: t.completed ? '#22c55e' : 'var(--color-text-faint)' }}>
                {t.completed ? '✓' : '•'}
              </span>
              <span style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>
                {t.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// DRAGGABLE GROUPS LIST
// ==========================================
interface GroupListProps {
  groups: Group[];
  priorities: Priority[];
  groupedTasks: Record<string, Record<string, Task[]>>;
  onUpdateGroupOrder: (groups: Group[]) => Promise<void>;
  onDeleteGroup: (id: string) => void;
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>;
}

export default function GroupList({
  groups,
  priorities,
  groupedTasks,
  onUpdateGroupOrder,
  onDeleteGroup,
  onUpdateGroup,
}: GroupListProps) {
  const [tasksCollapsedByGroup, setTasksCollapsedByGroup] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('taskflow.sidebar.groupTasksCollapsed');
      if (saved) {
        setTasksCollapsedByGroup(JSON.parse(saved));
      }
    } catch {
      // Ignore malformed localStorage and use defaults.
    }
  }, []);

  const toggleGroupTasksCollapsed = (groupId: string) => {
    setTasksCollapsedByGroup((prev) => {
      const next = { ...prev, [groupId]: !(prev[groupId] ?? true) };
      localStorage.setItem('taskflow.sidebar.groupTasksCollapsed', JSON.stringify(next));
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      
      const newArray = arrayMove(groups, oldIndex, newIndex);
      onUpdateGroupOrder(newArray);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={groups.map(g => g.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {groups.map((group) => {
            // Gathers all uncompleted tasks for this group, sorted by their priority order
            const groupTasks = Object.entries(groupedTasks).flatMap(([priorityId, groupMap]) => {
              const prioObj = priorities.find(p => p.id === priorityId);
              const order = prioObj ? prioObj.order : 999;
              return (groupMap[group.id] || [])
                .filter(t => !t.completed)
                .map(t => ({ ...t, _prioOrder: order }));
            }).sort((a, b) => a._prioOrder - b._prioOrder);

            return (
              <SortableGroupItem
                key={group.id}
                group={group}
                groupTasks={groupTasks}
                tasksCollapsed={tasksCollapsedByGroup[group.id] ?? true}
                onToggleTasksCollapsed={() => toggleGroupTasksCollapsed(group.id)}
                onDeleteGroup={onDeleteGroup}
                onUpdateGroup={onUpdateGroup}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
