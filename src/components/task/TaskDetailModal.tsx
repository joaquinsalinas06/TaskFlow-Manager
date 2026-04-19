'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Priority, Group, TaskType, ChecklistItem, UserSettings } from '@/types/index';
import { useTranslation } from '@/providers/I18nProvider';
import CustomSelect from '@/components/shared/CustomSelect';
import DatePicker from '@/components/shared/DatePicker';
import TimePicker from '@/components/shared/TimePicker';
import CreateTaskTypeModal from '@/components/task-type/CreateTaskTypeModal';
import {
  X as XIcon,
  Calendar as CalendarIcon,
  Mail,
  Link as LinkIcon,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  ExternalLink,
  AlertCircle,
  Save,
  PlusCircle,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  userSettings: UserSettings | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
}

export default function TaskDetailModal({
  task,
  priorities,
  groups,
  taskTypes,
  userSettings,
  onClose,
  onUpdate,
  onDelete,
  onToggle,
  onCreateTaskType,
}: TaskDetailModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Local Editable fields (NO auto-save, only saved when clicking "Save")
  const [title, setTitle] = useState(task.title);
  const [priorityId, setPriorityId] = useState(task.priorityId);
  const [groupId, setGroupId] = useState(task.groupId);
  const [typeId, setTypeId] = useState<string | null>(task.typeId ?? null);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [startTime, setStartTime] = useState(task.startTime ?? '');
  const [endTime, setEndTime] = useState(task.endTime ?? '');
  const [description, setDescription] = useState(task.description ?? '');
  const [links, setLinks] = useState<string[]>(task.links ?? []);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(task.checklistItems ?? []);
  const [sendEmail, setSendEmail] = useState<boolean | null>(task.sendEmailReminder ?? null);
  const [addCalendar, setAddCalendar] = useState<boolean | null>(task.addToCalendar ?? null);
  const [completed, setCompleted] = useState(task.completed ?? false);

  // UI State
  const [showMore, setShowMore] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeCreateModal, setShowTypeCreateModal] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Portal: wait for client mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-open "more" pane if task already has content there
  useEffect(() => {
    if (task.description || (task.links && task.links.length > 0) || (task.checklistItems && task.checklistItems.length > 0)) {
      setShowMore(true);
    }
  }, [task]);

  // Trap ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDueDate = (val: string | null) => {
    const next = val ?? '';
    setDueDate(next);
    if (!next) { setSendEmail(null); setAddCalendar(null); }
  };

  // Links
  const addLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed) return;
    setLinks([...links, trimmed]);
    setNewLink('');
  };
  const removeLink = (i: number) => {
    setLinks(links.filter((_, idx) => idx !== i));
  };

  // Checklist
  const addCheckItem = () => {
    const trimmed = newCheckItem.trim();
    if (!trimmed) return;
    const item: ChecklistItem = { id: Date.now().toString(), text: trimmed, done: false };
    setChecklistItems([...checklistItems, item]);
    setNewCheckItem('');
  };
  const toggleCheckItem = (id: string) => {
    setChecklistItems(checklistItems.map((c) => c.id === id ? { ...c, done: !c.done } : c));
  };
  const removeCheckItem = (id: string) => {
    setChecklistItems(checklistItems.filter((c) => c.id !== id));
  };

  // Notification toggles
  const handleEmailToggle = () => {
    setSendEmail(sendEmail === null ? !(userSettings?.emailReminders ?? false) : !sendEmail);
  };
  const handleCalendarToggle = () => {
    setAddCalendar(addCalendar === null ? !(userSettings?.calendarIntegration ?? false) : !addCalendar);
  };

  // Mark done inline (doesn't save the task, just changes local state)
  const toggleTaskCompletion = () => {
    setCompleted(!completed);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim() || task.title,
        priorityId,
        groupId,
        typeId,
        dueDate: dueDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        description: description.trim() || null,
        links,
        checklistItems,
        sendEmailReminder: sendEmail,
        addToCalendar: addCalendar,
        completed, // `onUpdate` will save completion status!
      });
      onClose(); // only close after saving successfully
    } catch {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try { await onDelete(task.id); onClose(); }
    catch { setIsDeleting(false); setConfirmDelete(false); }
  };

  // Derived
  const currentPriority = priorities.find((p) => p.id === priorityId);
  const checklistDone = checklistItems.filter((c) => c.done).length;
  const emailActive = sendEmail ?? userSettings?.emailReminders ?? false;
  const calActive = (addCalendar ?? userSettings?.calendarIntegration ?? false) && !!userSettings?.googleRefreshToken;
  const hasRichContent = !!description || links.length > 0 || checklistItems.length > 0;

  // ── Inline styles ─────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', color: 'var(--color-text-base)', fontSize: '0.875rem',
    padding: '0.5rem 0.75rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const lbl: React.CSSProperties = {
    fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-faint)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem', display: 'block',
  };
  const pill = (active: boolean, color = '#6366f1', bg = 'rgba(99,102,241,0.12)'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.6rem',
    borderRadius: '999px', border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
    background: active ? bg : 'transparent', color: active ? color : 'var(--color-text-faint)',
    fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  // ── Render ────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  const modal = (
    /* Full-viewport backdrop rendered via portal — escapes any parent transform/stacking context */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '540px', maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1.1rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
          marginBottom: 0,
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: currentPriority?.color ?? '#6366f1',
            boxShadow: `0 0 8px ${currentPriority?.color ?? '#6366f1'}99`,
          }} />
          <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
            {currentPriority?.name ?? '—'} · {groups.find(g => g.id === groupId)?.name ?? '—'}
            {typeId && ` · ${taskTypes.find(t => t.id === typeId)?.name ?? ''}`}
          </span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '999px',
            background: completed ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)',
            color: completed ? '#22c55e' : 'var(--color-text-faint)',
            border: `1px solid ${completed ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
          }}>
            {completed ? `✓ ${t('done')}` : t('pending')}
          </span>

          {/* Delete Button moved to Context Header next to close */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title={t('delete_task')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex', padding: '0.2rem', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <button onClick={handleDelete} disabled={isDeleting} title={t('confirm_delete_task')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: '0.2rem', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}>
              {isDeleting ? '...' : <AlertCircle size={15} />}
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex', padding: '0.2rem', borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-base)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
          >
            <XIcon size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: taskTypes.length > 0 ? '0.6rem 1.1rem 1.1rem' : '1rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

          {/* Task Type Tags (Moved to Top) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.15rem' }}>
            <button
              type="button"
              onClick={() => setTypeId(null)}
              style={{
                padding: '0.28rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: `1.5px solid ${typeId === null ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                background: typeId === null ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: typeId === null ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              }}
            >
              {t('no_type')}
            </button>
            {taskTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTypeId(type.id)}
                style={{
                  padding: '0.28rem 0.7rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: `1.5px solid ${typeId === type.id ? (type.color || 'var(--color-primary-light)') : 'var(--color-border)'}`,
                  background: typeId === type.id ? `${type.color || 'var(--color-primary-light)'}15` : 'transparent',
                  color: typeId === type.id ? (type.color || 'var(--color-primary-light)') : 'var(--color-text-muted)',
                }}
              >
                {type.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowTypeCreateModal(true)}
              title={t('new_task_type')}
              style={{
                padding: '0.28rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: '1.5px dashed var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                e.currentTarget.style.color = 'var(--color-primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-faint)';
              }}
            >
              <PlusCircle size={14} />
            </button>
          </div>

          {/* Title */}
          <div>
            <label style={lbl}>{t('task_title_label')}</label>
            <input
              ref={titleRef} style={inp} value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
              />
          </div>

          {/* Priority + Group */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <CustomSelect
              label={t('priority')}
              options={priorities.map(p => ({ value: p.id, label: p.name, color: p.color }))}
              value={priorityId}
              onChange={setPriorityId}
            />
            <CustomSelect
              label={t('group')}
              options={groups.map(g => ({ value: g.id, label: g.name, color: g.color }))}
              value={groupId}
              onChange={setGroupId}
            />
          </div>

          {/* Due Date */}
          <div>
            <label style={lbl}>{t('due_date_label')}</label>
            <DatePicker 
              value={dueDate || null} 
              onChange={handleDueDate} 
              placeholder={t('due_date_label')}
              weekStartsOn={userSettings?.weekStartsOn}
            />
          </div>

          {/* Start Time and End Time - Only shown when due date is set */}
          {dueDate && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={lbl}>{t('start_time_label')}</label>
                <TimePicker
                  value={startTime || null}
                  onChange={(val) => setStartTime(val || '')}
                  placeholder={t('start_time_label')}
                />
              </div>
              <div>
                <label style={lbl}>{t('end_time_label')}</label>
                <TimePicker
                  value={endTime || null}
                  onChange={(val) => setEndTime(val || '')}
                  placeholder={t('end_time_label')}
                />
              </div>
            </div>
          )}

          {/* Notification toggles */}
          {dueDate && (
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {userSettings?.emailReminders !== undefined && (
                <button type="button" onClick={handleEmailToggle} style={pill(emailActive, '#6366f1', 'rgba(99,102,241,0.12)')}>
                  <Mail size={11} />{t('send_reminder')}
                </button>
              )}
              {userSettings?.calendarIntegration !== undefined && (
                <button type="button" onClick={handleCalendarToggle}
                  disabled={!userSettings?.googleRefreshToken}
                  style={{ ...pill(calActive, '#22c55e', 'rgba(34,197,94,0.1)'), cursor: userSettings?.googleRefreshToken ? 'pointer' : 'not-allowed', opacity: userSettings?.googleRefreshToken ? 1 : 0.45 }}>
                  <CalendarIcon size={11} />{t('add_to_calendar')}
                </button>
              )}
            </div>
          )}

          {/* ── MORE OPTIONS TOGGLE ── */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
            <button
              onClick={() => setShowMore(!showMore)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                background: showMore ? 'var(--color-surface-2)' : 'transparent',
                border: `1px solid ${showMore ? 'var(--color-border)' : 'var(--color-border)'}`,
                color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = showMore ? 'var(--color-surface-2)' : 'transparent'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showMore ? t('less_options') : t('more_options')}
                {/* Rich content badges */}
                {hasRichContent && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {description && <FileText size={12} style={{ color: 'var(--color-primary-light)' }} />}
                    {links.length > 0 && <LinkIcon size={12} style={{ color: 'var(--color-primary-light)' }} />}
                    {checklistItems.length > 0 && (
                      <span style={{ fontSize: '0.65rem', color: checklistDone === checklistItems.length ? '#22c55e' : 'var(--color-primary-light)', fontWeight: 700 }}>
                        ✓ {checklistDone}/{checklistItems.length}
                      </span>
                    )}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* ── Extended options (collapsed by default) ── */}
          {showMore && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              {/* Description */}
              <div>
                <label style={lbl}><FileText size={10} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />{t('task_description_label')}</label>
                <textarea
                  style={{
                    ...inp, resize: 'vertical', minHeight: '72px', lineHeight: 1.5,
                    fontSize: '0.85rem', padding: '0.55rem 0.75rem',
                  } as React.CSSProperties}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('task_description_placeholder')}
                />
              </div>

              {/* Links */}
              <div>
                <label style={lbl}><LinkIcon size={10} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />{t('task_links_label')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: links.length > 0 ? '0.45rem' : 0 }}>
                  {links.map((url, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.6rem' }}>
                      <ExternalLink size={11} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
                      <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, fontSize: '0.78rem', color: 'var(--color-primary-light)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {url}
                      </a>
                      <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex', padding: '0.1rem', flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}>
                        <XIcon size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input style={{ ...inp, flex: 1, fontSize: '0.8rem', padding: '0.38rem 0.65rem' }}
                    value={newLink} onChange={(e) => setNewLink(e.target.value)}
                    placeholder={t('task_links_placeholder')}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
                  <button onClick={addLink} style={{ flexShrink: 0, padding: '0.38rem 0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                    <Plus size={12} />{t('add_link')}
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label style={{ ...lbl, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><CheckSquare size={10} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />{t('task_checklist_label')}</span>
                  {checklistItems.length > 0 && (
                    <span style={{ fontWeight: 700, color: checklistDone === checklistItems.length ? '#22c55e' : 'var(--color-text-faint)' }}>
                      {checklistDone}/{checklistItems.length}
                    </span>
                  )}
                </label>
                {checklistItems.length > 0 && (
                  <div style={{ height: '3px', background: 'var(--color-surface-4)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', width: `${(checklistDone / checklistItems.length) * 100}%`, background: '#22c55e', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.45rem' }}>
                  {checklistItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.28rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      <input type="checkbox" checked={item.done} onChange={() => toggleCheckItem(item.id)} className="task-checkbox" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.8rem', color: item.done ? 'var(--color-text-faint)' : 'var(--color-text-base)', textDecoration: item.done ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                        {item.text}
                      </span>
                      <button onClick={() => removeCheckItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex', padding: '0.1rem' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}>
                        <XIcon size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input style={{ ...inp, flex: 1, fontSize: '0.8rem', padding: '0.38rem 0.65rem' }}
                    value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                    placeholder={t('checklist_item_placeholder')}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckItem())} />
                  <button onClick={addCheckItem} style={{ flexShrink: 0, padding: '0.38rem 0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                    <Plus size={12} />{t('add_checklist_item')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0.75rem 1.1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            {/* Mark done */}
            <button
              onClick={toggleTaskCompletion}
              style={{
                flex: 1, padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${completed ? 'rgba(34,197,94,0.4)' : 'var(--color-border)'}`,
                background: completed ? 'rgba(34,197,94,0.08)' : 'transparent',
                color: completed ? '#22c55e' : 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', transition: 'all 0.15s',
              }}
            >
              <CheckSquare size={13} />
              {completed ? t('mark_pending') : t('mark_done')}
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1, padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-primary)',
                background: 'var(--color-primary)',
                color: '#ffffff',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', transition: 'all 0.15s',
              }}
            >
              <Save size={13} />
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </div>

        <CreateTaskTypeModal
          isOpen={showTypeCreateModal}
          onClose={() => setShowTypeCreateModal(false)}
          onCreate={onCreateTaskType}
          onSuccess={(type) => setTypeId(type.id)}
        />
      </div>
    </div>
  );

  // Render via portal so position:fixed is relative to the viewport, not any parent transform
  return createPortal(modal, document.body);
}
