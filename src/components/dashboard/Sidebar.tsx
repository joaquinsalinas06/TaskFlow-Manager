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
import { LogOut, Settings, Sun, Moon, Plus, ChevronDown, ChevronLeft, ChevronRight, CheckSquare, X as XIcon, Tag, Flag, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getInitials = (name: string) => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    return (words[0][0] + (words[1]?.[0] || '')).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
};

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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
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
  isCollapsed,
  onToggleCollapse,
  isMobile,
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

  const scrollToSection = (id: string, type: 'priority' | 'group') => {
    const element = type === 'priority' 
      ? document.getElementById(`priority-${id}`)
      : document.querySelector(`.group-section-${id}`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (activeView === 'settings') {
      onNavigate('dashboard');
    }
    if (isMobile) {
      onToggleCollapse();
    }
  };

  return (
    <>
      <motion.aside 
        className="sidebar"
        initial={false}
        animate={{ width: isCollapsed ? (isMobile ? 0 : 72) : 260 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        style={{ position: 'relative' }}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          style={{
            position: 'absolute',
            top: isCollapsed ? '1rem' : '1.5rem',
            right: isCollapsed ? '50%' : '1rem', 
            transform: isCollapsed ? 'translateX(50%)' : 'none',
            zIndex: 100,
            width: isCollapsed ? '2.5rem' : '1.75rem',
            height: isCollapsed ? '2.5rem' : '1.75rem',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: isCollapsed ? '12px' : 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-base)',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isCollapsed ? 'translateX(50%) scale(1.05)' : 'scale(1.1)';
            e.currentTarget.style.color = 'var(--color-primary-light)';
            e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isCollapsed ? 'translateX(50%)' : 'scale(1)';
            e.currentTarget.style.color = 'var(--color-text-base)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
          }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={16} />}
        </button>

        {/* Brand - Only visible when expanded */}
        {!isCollapsed && (
          <div className="sidebar-brand" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="sidebar-brand-icon" style={{ width: '2.25rem', height: '2.25rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-base)', lineHeight: 1.2 }}>
                  TaskFlow
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', letterSpacing: '0.04em' }}>
                  Task Manager
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isCollapsed && (
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
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isCollapsed ? '1rem 0.5rem' : '1rem 0.75rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isCollapsed ? '1rem' : '1.5rem',
          alignItems: isCollapsed ? 'center' : 'stretch'
        }}>
          {/* Priorities */}
          <div style={{ width: '100%' }}>
            {!isCollapsed ? (
              <>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setPrioritiesCollapsed(!prioritiesCollapsed)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <motion.div
                      animate={{ rotate: prioritiesCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      <ChevronDown size={14} className="text-faint" />
                    </motion.div>
                    <Flag size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('priorities')}</span>
                  </div>
                  <span className="badge">{priorities.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {!prioritiesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingBottom: '0.5rem' }}>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                {priorities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => scrollToSection(p.id, 'priority')}
                    title={p.name}
                    className="sidebar-dot-btn"
                    style={{
                      width: '2.2rem', height: '2.2rem', borderRadius: '50%',
                      background: p.color || 'var(--color-primary)',
                      border: '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.7rem', fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                  >
                    {getInitials(p.name)}
                  </button>
                ))}
                <button
                  onClick={() => setShowPriorityModal(true)}
                  style={{
                    width: '2rem', height: '2rem', borderRadius: '50%',
                    border: '1.5px dashed var(--color-border)',
                    background: 'transparent', color: 'var(--color-text-faint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Groups */}
          <div style={{ width: '100%' }}>
            {!isCollapsed ? (
              <>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setGroupsCollapsed(!groupsCollapsed)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <motion.div
                      animate={{ rotate: groupsCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      <ChevronDown size={14} className="text-faint" />
                    </motion.div>
                    <Folder size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('groups')}</span>
                  </div>
                  <span className="badge">{groups.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {!groupsCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingBottom: '0.5rem' }}>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => scrollToSection(g.id, 'group')}
                    title={g.name}
                    className="sidebar-dot-btn"
                    style={{
                      width: '2.2rem', height: '2.2rem', borderRadius: '8px',
                      background: g.color || 'var(--color-surface-3)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-text-base)', fontSize: '0.7rem', fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                  >
                    {getInitials(g.name)}
                  </button>
                ))}
                <button
                  onClick={() => setShowGroupModal(true)}
                  style={{
                    width: '2.2rem', height: '2.2rem', borderRadius: '8px',
                    border: '1.5px dashed var(--color-border)',
                    background: 'transparent', color: 'var(--color-text-faint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Task Types */}
          <div style={{ width: '100%' }}>
            {!isCollapsed ? (
              <>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setTaskTypesCollapsed(!taskTypesCollapsed)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <motion.div
                      animate={{ rotate: taskTypesCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      <ChevronDown size={14} className="text-faint" />
                    </motion.div>
                    <Tag size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('task_types')}</span>
                  </div>
                  <span className="badge">{taskTypes.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {!taskTypesCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingBottom: '0.5rem' }}>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                {taskTypes.map((t) => (
                  <button
                    key={t.id}
                    title={t.name}
                    className="sidebar-dot-btn"
                    style={{
                      width: '2.2rem', height: '2.2rem', borderRadius: 'var(--radius-sm)',
                      background: t.color || 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      cursor: 'default', transition: 'all 0.25s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-text-base)', fontSize: '0.7rem', fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                  >
                    {getInitials(t.name)}
                  </button>
                ))}
                <button
                  onClick={() => setShowTaskTypeModal(true)}
                  title={t('new_task_type')}
                  style={{
                    width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)',
                    border: '1.5px dashed var(--color-border)',
                    background: 'transparent', color: 'var(--color-text-faint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: isCollapsed ? '0.75rem' : '0.875rem 0.75rem', 
          borderTop: '1px solid var(--color-border)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          alignItems: isCollapsed ? 'center' : 'stretch'
        }}>
          {!isCollapsed ? (
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={toggleLanguage}
                title={t('toggle_language')}
                style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', color: 'var(--color-text-muted)'
                }}
              >
                {lang.toUpperCase()}
              </button>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
                style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)'
                }}
              >
                {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
              </button>
            </div>
          )}

          {/* Settings link */}
          <button
            id="sidebar-settings-btn"
            onClick={() => onNavigate(activeView === 'settings' ? 'dashboard' : 'settings')}
            className={isCollapsed ? "" : "btn btn-ghost"}
            style={isCollapsed ? {
              width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)',
              background: activeView === 'settings' ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: activeView === 'settings' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              cursor: 'pointer'
            } : {
              width: '100%',
              justifyContent: 'flex-start',
              gap: '0.6rem',
              padding: '0.5rem 0.75rem',
              background: activeView === 'settings' ? 'var(--color-surface-2)' : 'transparent',
              color: activeView === 'settings' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
            }}
            title={t('settings')}
          >
            <Settings size={15} />
            {!isCollapsed && t('settings')}
          </button>

          <button
            onClick={handleLogout}
            className={isCollapsed ? "" : "btn btn-ghost"}
            style={isCollapsed ? {
              width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-danger-light)', cursor: 'pointer'
            } : { width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.5rem 0.75rem' }}
            title={t('sign_out')}
          >
            <LogOut size={16} />
            {!isCollapsed && t('sign_out')}
          </button>
        </div>
      </motion.aside>

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
