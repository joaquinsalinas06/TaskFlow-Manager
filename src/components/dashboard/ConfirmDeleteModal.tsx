import React from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Task } from '@/types/index';

interface ConfirmDeleteModalProps {
  titleKey: string;
  itemName: string;
  linkedTasks: Task[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function ConfirmDeleteModal({
  titleKey,
  itemName,
  linkedTasks,
  onConfirm,
  onCancel,
  isDeleting
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();
  
  return (
    <div className="modal-backdrop" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)' }}>
            <div style={{ background: 'rgba(239,68,68,0.15)', padding: '0.5rem', borderRadius: '50%' }}>
              <AlertTriangle size={20} />
            </div>
            <span className="modal-title">{t(titleKey)}</span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onCancel}
            aria-label={t('cancel')}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-base)', lineHeight: 1.5 }}>
            {t('delete_confirmation')} <strong style={{color: 'var(--color-text-base)'}}>{itemName}</strong>.
          </p>
          
          {linkedTasks.length > 0 && (
            <div style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {t('delete_warning_tasks')}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-faint)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {linkedTasks.slice(0, 5).map(task => (
                  <li key={task.id}>{task.title}</li>
                ))}
                {linkedTasks.length > 5 && (
                  <li>{t('and_more').replace('{{count}}', String(linkedTasks.length - 5))}</li>
                )}
              </ul>
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                {t('delete_warning_consequence')}
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={onConfirm} 
              disabled={isDeleting}
              style={{ flex: 1, background: 'var(--color-danger)', border: 'none' }}
            >
              {isDeleting ? (
                <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={16} /> {t('delete_forever')}
                </span>
              )}
            </button>
            <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
