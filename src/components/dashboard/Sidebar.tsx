'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/providers/I18nProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Priority, Group, Task } from '@/types/index';
import PriorityList from '@/components/priority/PriorityList';
import ColorPicker from '@/components/shared/ColorPicker';

interface SidebarProps {
  priorities: Priority[];
  groups: Group[];
  groupedTasks: Record<string, Record<string, Task[]>>;
  onCreatePriority: (name: string) => Promise<Priority>;
  onCreateGroup: (name: string) => Promise<Group>;
  onUpdatePriorityOrder: (priorities: Priority[]) => Promise<void>;
  onDeletePriority: (id: string) => Promise<void>;
  onUpdatePriority: (id: string, data: Partial<Priority>) => Promise<void>;
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  activeView: 'dashboard' | 'settings';
  onNavigate: (view: 'dashboard' | 'settings') => void;
}

export default function Sidebar({
  priorities,
  groups,
  groupedTasks,
  onCreatePriority,
  onCreateGroup,
  onUpdatePriorityOrder,
  onDeletePriority,
  onUpdatePriority,
  onUpdateGroup,
  activeView,
  onNavigate,
}: SidebarProps) {
  const { logout } = useAuth();
  const { t, lang, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [prioritiesCollapsed, setPrioritiesCollapsed] = useState(false);
  const [groupsCollapsed, setGroupsCollapsed] = useState(false);
  const [priorityName, setPriorityName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...priorities];
    if (direction === 'up' && index > 0) {
      [newPriorities[index], newPriorities[index - 1]] = [newPriorities[index - 1], newPriorities[index]];
    } else if (direction === 'down' && index < newPriorities.length - 1) {
      [newPriorities[index], newPriorities[index + 1]] = [newPriorities[index + 1], newPriorities[index]];
    }
    onUpdatePriorityOrder(newPriorities);
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err: any) { setError(err.message || 'Failed to logout'); }
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
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', transform: prioritiesCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('priorities')}</span>
              </div>
              <span className="badge">{priorities.length}</span>
            </div>

            {!prioritiesCollapsed && (
              <>
                {priorities.length > 0 ? (
                  <PriorityList
                    priorities={priorities}
                    onMovePriority={movePriority}
                    onDeletePriority={onDeletePriority}
                    onUpdateColor={(id, color) => onUpdatePriority(id, { color })}
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
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
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
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', transform: groupsCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                <span className="sidebar-section-label" style={{ padding: 0, marginTop: 0, marginBottom: 0 }}>{t('groups')}</span>
              </div>
              <span className="badge">{groups.length}</span>
            </div>

            {!groupsCollapsed && (
              <>
                {groups.length > 0 ? (
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
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div className="sidebar-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ColorPicker
                              color={group.color || '#6366f1'}
                              onChange={(val) => onUpdateGroup(group.id, { color: val })}
                              size={10}
                            />
                            <span style={{ flex: 1 }}>{group.name}</span>
                          </div>
                          
                          {/* Task Legend */}
                          {groupTasks.length > 0 && (
                            <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginBottom: '0.25rem' }}>
                              {groupTasks.map(t => (
                                <div key={t.id} style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--color-text-faint)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                  • {t.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.25rem 0' }}>
                    {t('no_groups_yet')}
                  </p>
                )}

                <button
                  className="sidebar-add-btn"
                  onClick={() => { setShowGroupModal(true); setGroupName(''); setError(''); }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
                  {t('new_group')}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {theme === 'dark' ? (
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </>
                )}
              </svg>
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {t('settings')}
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.5rem 0.75rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
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
    </>
  );
}
