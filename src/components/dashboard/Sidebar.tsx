'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/providers/I18nProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Priority, Group, Task, TaskType } from '@/types/index';
import PriorityList from '@/components/priority/PriorityList';
import GroupList from '@/components/group/GroupList';
import TaskTypeList from '@/components/task-type/TaskTypeList';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import CreateTaskTypeModal from '@/components/task-type/CreateTaskTypeModal';
import { LogOut, Settings, Sun, Moon, Plus, ChevronDown, ChevronRight, CheckSquare, X as XIcon, Tag } from 'lucide-react';

interface SidebarProps {
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  groupedTasks: Record<string, Record<string, Task[]>>;
  onCreatePriority: (name: string) => Promise<Priority>;
  onCreateGroup: (name: string) => Promise<Group>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
  onUpdatePriorityOrder: (priorities: Priority[]) => Promise<void>;
  onUpdateGroupOrder: (groups: Group[]) => Promise<void>;
  onUpdateTaskTypeOrder: (types: TaskType[]) => Promise<void>;
  onDeletePriority: (id: string) => Promise<void>;
  onUpdatePriority: (id: string, data: Partial<Priority>) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  onDeleteTaskType: (id: string) => Promise<void>;
  onUpdateTaskType: (id: string, data: Partial<TaskType>) => Promise<void>;
  activeView: 'dashboard' | 'settings';
  onNavigate: (view: 'dashboard' | 'settings') => void;
}

export default function Sidebar({
  priorities,
  groups,
  taskTypes,
  groupedTasks,
  onCreatePriority,
  onCreateGroup,
  onCreateTaskType,
  onUpdatePriorityOrder,
  onUpdateGroupOrder,
  onUpdateTaskTypeOrder,
  onDeletePriority,
  onUpdatePriority,
  onDeleteGroup,
  onUpdateGroup,
  onDeleteTaskType,
  onUpdateTaskType,
  activeView,
  onNavigate,
}: SidebarProps) {
  const { logout } = useAuth();
  const { t, lang, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [prioritiesCollapsed, setPrioritiesCollapsed] = useState(false);
  const [groupsCollapsed, setGroupsCollapsed] = useState(false);
  const [taskTypesCollapsed, setTaskTypesCollapsed] = useState(false);
  const [priorityName, setPriorityName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'group' | 'priority' | 'taskType' } | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const handleCreatePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityName.trim()) return;
    setSaving(true);
    try {
      await onCreatePriority(priorityName.trim());
      setPriorityName('');
      setShowPriorityModal(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create priority');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName('');
      setShowGroupModal(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };



  const handleLogout = async () => {
    try { await logout(); } catch (err: any) { setError(err.message || 'Failed to logout'); }
  };

  const getLinkedTasks = (id: string, type: 'group' | 'priority' | 'taskType') => {
    const linked: Task[] = [];
    Object.values(groupedTasks).forEach(groupMap => {
      Object.entries(groupMap).forEach(([groupId, tasks]) => {
        tasks.forEach(t => {
          if (
            (type === 'group' && groupId === id) || 
            (type === 'priority' && t.priorityId === id) ||
            (type === 'taskType' && t.typeId === id)
          ) {
            linked.push(t);
          }
        });
      });
    });
    return linked;
  };

  const confirmDelete = (id: string, name: string, type: 'group' | 'priority' | 'taskType') => {
    setItemToDelete({ id, name, type });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setDeleteSaving(true);
    try {
      if (itemToDelete.type === 'priority') {
        await onDeletePriority(itemToDelete.id);
      } else if (itemToDelete.type === 'group') {
        await onDeleteGroup(itemToDelete.id);
      } else {
        await onDeleteTaskType(itemToDelete.id);
      }
      setItemToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="sidebar-brand-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-base)', lineHeight: 1.2 }}>
                TaskFlow
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', letterSpacing: '0.04em' }}>
                Task Manager
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: '0.75rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.8rem',
          }}>
            {error}
          </div>
        )}

        {/* Scrollable nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Priorities */}
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
              onClick={() => setPrioritiesCollapsed(!prioritiesCollapsed)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {prioritiesCollapsed ? <ChevronRight size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
                <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('priorities')}</span>
              </div>
              <span className="badge">{priorities.length}</span>
            </div>

            {!prioritiesCollapsed && (
              <>
                {priorities.length > 0 ? (
                  <PriorityList
                    priorities={priorities}
                    onUpdatePriorityOrder={onUpdatePriorityOrder}
                    onDeletePriority={(id) => confirmDelete(id, priorities.find(p => p.id === id)?.name || '', 'priority')}
                    onUpdatePriority={onUpdatePriority}
                  />
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.25rem 0' }}>
                    {t('no_priorities_yet')}
                  </p>
                )}

                <button
                  className="sidebar-add-btn"
                  onClick={() => { setShowPriorityModal(true); setPriorityName(''); setError(''); }}
                >
                  <Plus size={16} />
                  {t('new_priority')}
                </button>
              </>
            )}
          </div>

          {/* Groups */}
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
              onClick={() => setGroupsCollapsed(!groupsCollapsed)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {groupsCollapsed ? <ChevronRight size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
                <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('groups')}</span>
              </div>
              <span className="badge">{groups.length}</span>
            </div>

            {!groupsCollapsed && (
              <>
                {groups.length > 0 ? (
                  <GroupList
                    groups={groups}
                    priorities={priorities}
                    groupedTasks={groupedTasks}
                    onUpdateGroupOrder={onUpdateGroupOrder}
                    onDeleteGroup={(id) => confirmDelete(id, groups.find(g => g.id === id)?.name || '', 'group')}
                    onUpdateGroup={onUpdateGroup}
                  />
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.25rem 0' }}>
                    {t('no_groups_yet')}
                  </p>
                )}

                <button
                  className="sidebar-add-btn"
                  onClick={() => { setShowGroupModal(true); setGroupName(''); setError(''); }}
                >
                  <Plus size={16} />
                  {t('new_group')}
                </button>
              </>
            )}
          </div>

          {/* Task Types */}
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
              onClick={() => setTaskTypesCollapsed(!taskTypesCollapsed)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {taskTypesCollapsed ? <ChevronRight size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
                <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('task_types')}</span>
              </div>
              <span className="badge">{taskTypes.length}</span>
            </div>

            {!taskTypesCollapsed && (
              <>
                {taskTypes.length > 0 ? (
                  <TaskTypeList
                    taskTypes={taskTypes}
                    onUpdateOrder={onUpdateTaskTypeOrder}
                    onDelete={(id) => confirmDelete(id, taskTypes.find(t => t.id === id)?.name || '', 'taskType')}
                    onUpdate={onUpdateTaskType}
                  />
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.25rem 0' }}>
                    {t('no_task_types_yet')}
                  </p>
                )}

                <button
                  className="sidebar-add-btn"
                  onClick={() => { setShowTaskTypeModal(true); setError(''); }}
                >
                  <Plus size={16} />
                  {t('new_task_type')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.875rem 0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={toggleLanguage}
              className="btn btn-ghost"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.3rem' }}
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.3rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>
              {theme === 'dark' ? t('light_mode') : t('dark_mode')}
            </button>
          </div>

          {/* Settings link */}
          <button
            id="sidebar-settings-btn"
            onClick={() => onNavigate(activeView === 'settings' ? 'dashboard' : 'settings')}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: '0.6rem',
              padding: '0.5rem 0.75rem',
              background: activeView === 'settings' ? 'var(--color-surface-2)' : 'transparent',
              color: activeView === 'settings' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
            }}
          >
            <Settings size={15} />
            {t('settings')}
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.5rem 0.75rem' }}
          >
            <LogOut size={16} />
            {t('sign_out')}
          </button>
        </div>
      </aside>

      {/* ── Priority Modal ── */}
      {showPriorityModal && (
        <div className="modal-backdrop" onClick={() => setShowPriorityModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('new_priority')}</span>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowPriorityModal(false)}
                aria-label={t('cancel')}
              >
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePriority} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">{t('priority_name_label')}</label>
                <input
                  className="input"
                  value={priorityName}
                  onChange={(e) => setPriorityName(e.target.value)}
                  placeholder={t('priority_name_placeholder')}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={saving || !priorityName.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? t('creating') : t('create_priority')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPriorityModal(false)} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Group Modal ── */}
      {showGroupModal && (
        <div className="modal-backdrop" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('new_group')}</span>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowGroupModal(false)}
                aria-label={t('cancel')}
              >
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">{t('group_name_label')}</label>
                <input
                  className="input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('group_name_placeholder')}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={saving || !groupName.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? t('creating') : t('create_group')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowGroupModal(false)} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Task Type Modal ── */}
      <CreateTaskTypeModal
        isOpen={showTaskTypeModal}
        onClose={() => setShowTaskTypeModal(false)}
        onCreate={onCreateTaskType}
      />
      {/* ── Confirm Delete Modal ── */}
      {itemToDelete && (
        <ConfirmDeleteModal
          titleKey={
            itemToDelete.type === 'priority' ? 'delete_priority_title' : 
            itemToDelete.type === 'group' ? 'delete_group_title' : 
            'delete_task_type_title'
          }
          itemName={itemToDelete.name}
          linkedTasks={getLinkedTasks(itemToDelete.id, itemToDelete.type)}
          onConfirm={executeDelete}
          onCancel={() => setItemToDelete(null)}
          isDeleting={deleteSaving}
        />
      )}
    </>
  );
}
