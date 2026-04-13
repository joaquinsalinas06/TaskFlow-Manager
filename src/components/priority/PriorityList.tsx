'use client';

import { useState } from 'react';
import { Priority } from '@/types/index';
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
import { GripVertical, X as XIcon } from 'lucide-react';

// ==========================================
// INDIVIDUAL SORTABLE ITEM (PRIORITY)
// ==========================================
function SortablePriorityItem({
  priority,
  onDeletePriority,
  onUpdateColor,
  onUpdateName,
}: {
  priority: Priority;
  onDeletePriority: (id: string) => void;
  onUpdateColor: (id: string, newColor: string) => void;
  onUpdateName: (id: string, newName: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(priority.name);

  const handleBlur = () => {
    setIsEditing(false);
    if (editName.trim() !== '' && editName !== priority.name) {
      onUpdateName(priority.id, editName.trim());
    } else {
      setEditName(priority.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setEditName(priority.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '0.45rem 0.6rem',
        borderRadius: 'var(--radius-md)',
        gap: '0.5rem',
        transition: isDragging ? 'none' : 'background 0.15s, box-shadow 0.15s',
        background: isDragging ? 'var(--color-surface-2)' : 'transparent',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
      }}
      className="priority-list-row"
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.background = 'var(--color-surface-2)'}}
      onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.background = 'transparent'}}
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

      {/* Color Picker */}
      <ColorPicker
        color={priority.color || '#6366f1'}
        onChange={(val) => onUpdateColor(priority.id, val)}
        size={10}
        title="Change priority color"
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
              fontWeight: 500,
              padding: '0.1rem 0.4rem',
              outline: 'none',
            }}
          />
        ) : (
          <span 
            style={{ 
              flex: 1, 
              fontSize: '0.85rem', 
              fontWeight: 500, 
              color: 'var(--color-text-base)',
              cursor: 'text',
              padding: '0.2rem 0',
            }}
            onClick={() => setIsEditing(true)}
            title="Click to rename"
          >
            {priority.name}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.1rem' }}>
        <button
          onClick={() => onDeletePriority(priority.id)}
          title="Delete default"
          style={{
            padding: '0.2rem 0.3rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'none',
            color: 'var(--color-text-faint)',
            cursor: 'pointer',
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
    </div>
  );
}

// ==========================================
// DRAGGABLE PRIORITIES LIST
// ==========================================
interface PriorityListProps {
  priorities: Priority[];
  onUpdatePriorityOrder: (priorities: Priority[]) => Promise<void>;
  onDeletePriority: (id: string) => void;
  onUpdatePriority: (id: string, data: Partial<Priority>) => Promise<void>;
}

export default function PriorityList({
  priorities,
  onUpdatePriorityOrder,
  onDeletePriority,
  onUpdatePriority,
}: PriorityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before dragging starts (allows clicks on ColorPicker/inputs)
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = priorities.findIndex((p) => p.id === active.id);
      const newIndex = priorities.findIndex((p) => p.id === over.id);
      
      const newArray = arrayMove(priorities, oldIndex, newIndex);
      onUpdatePriorityOrder(newArray);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={priorities.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.25rem' }}>
          {priorities.map((priority) => (
            <SortablePriorityItem
              key={priority.id}
              priority={priority}
              onDeletePriority={onDeletePriority}
              onUpdateColor={(id, color) => onUpdatePriority(id, { color })}
              onUpdateName={(id, name) => onUpdatePriority(id, { name })}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
