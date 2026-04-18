// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, XCircle, ChevronRight, Group as GroupIcon } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Priority, Group, Notification } from '@/types/index';
import { useTranslation } from '@/providers/I18nProvider';
import CustomSelect from '@/components/shared/CustomSelect';

interface NotificationsDropdownProps {
  userId: string;
  priorities: Priority[];
  groups: Group[];
  isCollapsed: boolean;
  onRefreshTasks?: () => Promise<void>;
}

export default function NotificationsDropdown({ userId, priorities, groups, isCollapsed, onRefreshTasks }: NotificationsDropdownProps) {
  const { t } = useTranslation();
  const { notifications, acceptInvitation, rejectInvitation, loading } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartAccept = (notif: Notification) => {
    setAcceptingId(notif.id);
    
    // Auto-suggest priority/group if same name exists
    const defaultPriority = priorities[0]?.id || '';
    const matchingGroup = groups.find(g => g.name.toLowerCase() === 'general' || g.name.toLowerCase() === 'inbox');
    
    setSelectedPriority(defaultPriority);
    setSelectedGroup(matchingGroup?.id || groups[0]?.id || '');
  };

  const handleFinalAccept = async () => {
    if (!acceptingId) return;
    setIsProcessing(true);
    try {
      await acceptInvitation(acceptingId, selectedPriority, selectedGroup);
      setAcceptingId(null);
      setIsOpen(false);
      if (onRefreshTasks) await onRefreshTasks();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: isCollapsed ? 'auto' : '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost"
        style={{
          width: isCollapsed ? '1.75rem' : '100%',
          height: isCollapsed ? '1.75rem' : 'auto',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '0.6rem',
          padding: isCollapsed ? '0' : '0.5rem 0.75rem',
          position: 'relative',
          background: isOpen ? 'var(--color-surface-2)' : 'transparent',
          color: notifications.length > 0 ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
        }}
        title={t('notifications')}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Bell size={16} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--color-danger)', border: '2px solid var(--color-surface-1)',
              fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }} />
          )}
        </div>
        {!isCollapsed && (
          <span style={{ flex: 1, textAlign: 'left' }}>{t('notifications')}</span>
        )}
        {!isCollapsed && notifications.length > 0 && (
          <span className="badge" style={{ background: 'var(--color-danger)', color: 'white', border: 'none' }}>
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: isCollapsed ? '3.5rem' : 0,
              marginBottom: '0.4rem',
              width: '260px',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-base)' }}>{t('notifications')}</span>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.5rem' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                  {t('no_notifications')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} style={{
                      padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    }}>
                      {acceptingId === notif.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                            {t('accept_task_setup')}
                          </span>
                          <CustomSelect
                            label={t('priority')}
                            options={priorities.map(p => ({ value: p.id, label: p.name, color: p.color }))}
                            value={selectedPriority}
                            onChange={setSelectedPriority}
                          />
                          <CustomSelect
                            label={t('group')}
                            options={groups.map(g => ({ value: g.id, label: g.name, color: g.color }))}
                            value={selectedGroup}
                            onChange={setSelectedGroup}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button 
                              onClick={handleFinalAccept}
                              disabled={isProcessing}
                              className="btn btn-primary" 
                              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                            >
                              {isProcessing ? '...' : t('accept')}
                            </button>
                            <button 
                              onClick={() => setAcceptingId(null)}
                              disabled={isProcessing}
                              className="btn btn-ghost" 
                              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ marginBottom: '0.4rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0, color: 'var(--color-text-base)', lineHeight: 1.25 }}>
                              {notif.taskData.title}
                            </p>
                            <p style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)', margin: '1px 0 0' }}>
                              {t('invited_by')}: <span style={{ color: 'var(--color-text-muted)' }}>{notif.fromEmail}</span>
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              onClick={() => handleStartAccept(notif)}
                              className="btn btn-primary" 
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', height: 'auto' }}
                            >
                              <Check size={12} style={{ marginRight: '0.2rem' }} /> {t('accept')}
                            </button>
                            <button 
                              onClick={() => rejectInvitation(notif.id)}
                              className="btn btn-ghost" 
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', height: 'auto', border: '1px solid var(--color-border)' }}
                            >
                              <XCircle size={12} style={{ marginRight: '0.2rem' }} /> {t('reject')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
