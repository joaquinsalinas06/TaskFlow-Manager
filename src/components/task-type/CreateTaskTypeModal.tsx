'use client';

import { useState } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { X as XIcon } from 'lucide-react';
import { TaskType } from '@/types/index';

interface CreateTaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<TaskType>;
  onSuccess?: (type: TaskType) => void;
}

export default function CreateTaskTypeModal({
  isOpen,
  onClose,
  onCreate,
  onSuccess
}: CreateTaskTypeModalProps) {
  const { t } = useTranslation();
  const [taskTypeName, setTaskTypeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTypeName.trim()) return;
    
    setSaving(true);
    setError('');
    
    try {
      const newType = await onCreate(taskTypeName.trim());
      setTaskTypeName('');
      onClose();
      if (onSuccess) onSuccess(newType);
    } catch (err: any) {
      setError(err.message || 'Failed to create task type');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{t('new_task_type')}</span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label={t('cancel')}
          >
            <XIcon size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
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
          
          <div>
            <label className="label">{t('task_type_name_label')}</label>
            <input
              className="input"
              value={taskTypeName}
              onChange={(e) => setTaskTypeName(e.target.value)}
              placeholder={t('task_type_name_placeholder')}
              autoFocus
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="submit" 
              disabled={saving || !taskTypeName.trim()} 
              className="btn btn-primary" 
              style={{ flex: 1 }}
            >
              {saving ? t('creating') : t('create_task_type')}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose} 
              style={{ flex: 1 }}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
