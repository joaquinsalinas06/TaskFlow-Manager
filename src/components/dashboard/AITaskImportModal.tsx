'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { 
  X as XIcon, Sparkles, Copy, Check, ChevronRight, AlertCircle, 
  Mail, Calendar as CalendarIcon, Loader2, Info, Trash2, ChevronLeft, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Group, TaskType, UserSettings } from '@/types/index';
import DatePicker from '../shared/DatePicker';
import CustomSelect from '../shared/CustomSelect';

interface AITaskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  userSettings: UserSettings | null;
  onCreateTask: (
    title: string, priorityId: string, groupId: string, 
    dueDate: string | null, sendEmailReminder: boolean | null, addCalendar: boolean | null,
    description?: string | null, links?: string[], checklistItems?: any[],
    priorityName?: string, groupName?: string, typeId?: string | null, typeName?: string
  ) => Promise<any>;
  onCreateGroup: (name: string) => Promise<Group>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
}

interface ParsedTask {
  title: string;
  priority: string;   // Name
  group: string;      // Name
  type?: string;      // Name
  dueDate: string | null;
  description?: string;
  links?: string[];
  checklist?: string[] | { text: string; done: boolean }[];
  // Local UI state
  enabled: boolean;
  sendEmail: boolean | null;
  addToCalendar: boolean | null;
}

export default function AITaskImportModal({
  isOpen,
  onClose,
  priorities,
  groups,
  taskTypes,
  userSettings,
  onCreateTask,
  onCreateGroup,
  onCreateTaskType
}: AITaskImportModalProps) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Parsed data
  const [importedTasks, setImportedTasks] = useState<ParsedTask[]>([]);
  const [newGroupsToCreate, setNewGroupsToCreate] = useState<string[]>([]);
  const [newTaskTypesToCreate, setNewTaskTypesToCreate] = useState<string[]>([]);

  // ── Step 1: Prompt Generation ──────────────────────────────────────────────

  const generatedPrompt = useMemo(() => {
    const priorityNames = priorities.map(p => p.name).join(', ');
    const groupNames = groups.map(g => g.name).join(', ');
    const typeNames = taskTypes.map(t => t.name).join(', ');

    return `I want you to parse a list of tasks, assignments, or events from the following text or document. 
I am using a task manager with these existing categories:
- Existing Priorities: ${priorityNames}
- Existing Groups: ${groupNames}
- Existing Task Types: ${typeNames}

IMPORTANT STEPS:
1. First, generate a clearly visible Markdown summary table of all the tasks, dates, and categories you found so I can review them.
2. If a task doesn't fit into existing groups, infer a logical specific name (e.g., use the Course name like "Sistemas Operativos" if the input is an academic annex, instead of generic terms like "Course" or "Annex").
3. Translate the content (titles, descriptions) into ${language === 'es' ? 'Spanish' : 'English'}.
4. Finally, return a valid JSON block with this structure:

{
  "newGroups": ["Specific Group Name", ...],
  "newTaskTypes": ["Specific Type Name", ...],
  "tasks": [
    {
      "title": "Task Title",
      "dueDate": "YYYY-MM-DD" (or null if not found),
      "priority": "Existing Priority Name",
      "group": "Existing or New Group Name",
      "type": "Existing or New Type Name" (optional),
      "description": "Short description if available",
      "links": ["url1", "url2"],
      "checklist": ["subtask1", "subtask2"]
    }
  ]
}

Only return the table and the JSON block.`;
  }, [priorities, groups, taskTypes, language]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step 2: Analysis ───────────────────────────────────────────────────────

  const handleAnalyze = () => {
    try {
      const cleanJson = jsonInput.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (!data.tasks || !Array.isArray(data.tasks)) {
        setError(t('ia_no_tasks_found'));
        return;
      }

      setImportedTasks(data.tasks.map((tItem: any) => ({
        ...tItem,
        enabled: true,
        sendEmail: userSettings?.emailReminders ?? null,
        addToCalendar: userSettings?.calendarIntegration ?? null
      })));
      setNewGroupsToCreate(data.newGroups || []);
      setNewTaskTypesToCreate(data.newTaskTypes || []);
      setError('');
      setStep(3);
    } catch (err) {
      setError(t('ia_invalid_json'));
    }
  };

  // ── Step 3: Final Import ───────────────────────────────────────────────────

  const handleImport = async () => {
    setProcessing(true);
    setError('');
    try {
      const activeTasks = importedTasks.filter(item => item.enabled);

      // 1. Identify and create missing groups
      const groupMap: Record<string, string> = {}; // Name (lowercase) -> ID
      groups.forEach(g => { groupMap[g.name.toLowerCase()] = g.id; });
      
      const missingGroups = Array.from(new Set(
        activeTasks
          .map(t => t.group.trim())
          .filter(name => name && !groupMap[name.toLowerCase()])
      ));

      for (const gName of missingGroups) {
        const created = await onCreateGroup(gName);
        groupMap[gName.toLowerCase()] = created.id;
      }

      // 2. Identify and create missing task types
      const typeMap: Record<string, string> = {}; // Name (lowercase) -> ID
      taskTypes.forEach(tType => { typeMap[tType.name.toLowerCase()] = tType.id; });

      const missingTypes = Array.from(new Set(
        activeTasks
          .map(t => t.type?.trim())
          .filter(name => name && !typeMap[name.toLowerCase()])
      )) as string[];

      for (const tName of missingTypes) {
        const created = await onCreateTaskType(tName);
        typeMap[tName.toLowerCase()] = created.id;
      }

      // 3. Create tasks
      const priorityMap: Record<string, string> = {};
      priorities.forEach(p => { priorityMap[p.name.toLowerCase()] = p.id; });

      for (const tData of activeTasks) {
        const pId = (tData.priority && priorityMap[tData.priority.toLowerCase()]) || priorities[0].id;
        const gId = (tData.group && groupMap[tData.group.toLowerCase()]) || groups[0].id;
        const tId = tData.type ? typeMap[tData.type.toLowerCase()] : null;

        await onCreateTask(
          tData.title,
          pId,
          gId,
          tData.dueDate,
          tData.sendEmail,
          tData.addToCalendar,
          tData.description,
          tData.links,
          tData.checklist?.map((c: any) => typeof c === 'string' ? { id: Math.random().toString(), text: c, done: false } : { id: Math.random().toString(), ...c }),
          tData.priority,
          tData.group,
          tId,
          tData.type
        );
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Error importing tasks');
    } finally {
      setProcessing(false);
    }
  };

  const updateTaskField = (index: number, field: keyof ParsedTask, value: any) => {
    setImportedTasks(prev => prev.map((tItem, i) => i === index ? { ...tItem, [field]: value } : tItem));
  };

  const removeTask = (index: number) => {
    setImportedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTask = (index: number) => {
    updateTaskField(index, 'enabled', !importedTasks[index].enabled);
  };

  // Options for selects
  const priorityOptions = useMemo(() => 
    priorities.map(p => ({ value: p.name, label: p.name, color: p.color }))
  , [priorities]);

  const groupOptions = useMemo(() => {
    const existing = groups.map(g => ({ value: g.name, label: g.name }));
    const existingNames = new Set(groups.map(g => g.name.toLowerCase()));
    const suggested = newGroupsToCreate
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({ value: name, label: `+ ${name}` }));
    return [...existing, ...suggested];
  }, [groups, newGroupsToCreate]);

  const typeOptions = useMemo(() => {
    const existing = taskTypes.map(t => ({ value: t.name, label: t.name }));
    const existingNames = new Set(taskTypes.map(t => t.name.toLowerCase()));
    const suggested = newTaskTypesToCreate
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({ value: name, label: `+ ${name}` }));
    return [...existing, ...suggested];
  }, [taskTypes, newTaskTypesToCreate]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px', width: '96%', maxHeight: '94vh', padding: 0, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.5rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <span className="modal-title" style={{ fontSize: '1.1rem' }}>{t('ia_import')}</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '-0.1rem' }}>{t('ia_import_desc')}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('cancel')}><XIcon size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {step === 1 && (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary-light)' }}>1.</span> {t('ia_step_1_title')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {t('ia_step_1_desc')}
                </p>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea 
                  readOnly
                  value={generatedPrompt}
                  style={{
                    width: '100%', height: '280px', background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)',
                    fontFamily: 'monospace', resize: 'none', outline: 'none'
                  }}
                />
                <button 
                  onClick={handleCopyPrompt}
                  className="btn btn-primary"
                  style={{ position: 'absolute', bottom: '1rem', right: '1rem', gap: '0.5rem', transform: 'scale(0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? t('ia_prompt_copied') : t('ia_copy_prompt')}
                </button>
              </div>

              <button onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}>
                {t('next')} <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary-light)' }}>2.</span> {t('ia_step_2_title')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {t('ia_step_2_desc')}
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center'
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <textarea 
                placeholder='{ "tasks": [...] }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                style={{
                  width: '100%', height: '220px', background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-base)',
                  fontFamily: 'monospace', resize: 'none', outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>{t('back')}</button>
                <button 
                  onClick={handleAnalyze} 
                  disabled={!jsonInput.trim()} 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {t('ia_analyze')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} style={{ color: 'var(--color-primary-light)' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {t('ia_step_3_desc')}
                </p>
              </div>

              {/* Summary of what will be created */}
              {(newGroupsToCreate.length > 0 || newTaskTypesToCreate.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {newGroupsToCreate.map(gName => (
                    <span key={gName} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '999px', color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      + {t('group')}: {gName}
                    </span>
                  ))}
                  {newTaskTypesToCreate.map(tName => (
                    <span key={tName} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '999px', color: '#22c55e', fontWeight: 600 }}>
                      + {t('task_type')}: {tName}
                    </span>
                  ))}
                </div>
              )}

              {/* Task List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {importedTasks.map((task, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-lg)', 
                    background: task.enabled ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    opacity: task.enabled ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    transition: 'all 0.2s',
                    minHeight: '70px',
                    position: 'relative'
                  }}>
                    {/* Checkbox */}
                    <input 
                      type="checkbox" 
                      checked={task.enabled} 
                      onChange={() => toggleTask(idx)} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, marginTop: '0.25rem' }}
                    />
                    
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {/* Title Row */}
                      <input
                        value={task.title}
                        onChange={(e) => updateTaskField(idx, 'title', e.target.value)}
                        disabled={!task.enabled}
                        placeholder={t('task_title_placeholder')}
                        style={{
                          width: '100%',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          padding: '0',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-text-base)',
                          outline: 'none',
                          lineHeight: 1.4
                        }}
                      />

                      {/* Meta Row: Compact text-like triggers */}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        columnGap: '1rem',
                        rowGap: '0.5rem',
                        alignItems: 'center',
                        pointerEvents: task.enabled ? 'auto' : 'none',
                      }}>
                        {/* Date Picker (Slim) */}
                        <div style={{ flexShrink: 0, minWidth: '120px', maxWidth: '100%' }}>
                          <style>{`
                            .slim-picker .input {
                              background: transparent !important;
                              border: none !important;
                              padding: 0 !important;
                              height: auto !important;
                              min-height: 0 !important;
                              box-shadow: none !important;
                              width: auto !important;
                            }
                            .slim-picker .input span { font-size: 0.75rem !important; font-weight: 600 !important; }
                            .slim-picker .input svg { width: 12px !important; height: 12px !important; margin-left: 4px; }
                            /* Ensure priority color dot is visible and decent size */
                            .slim-picker .input div span[style*="border-radius: 50%"] {
                              width: 10px !important;
                              height: 10px !important;
                            }
                          `}</style>
                          <div className="slim-picker">
                            <DatePicker 
                              value={task.dueDate} 
                              onChange={(val) => updateTaskField(idx, 'dueDate', val)} 
                              placeholder={t('no_date') || "Select Date"}
                            />
                          </div>
                        </div>

                        {/* Priority Picker (Slim) */}
                        <div style={{ flexShrink: 0, minWidth: '110px', maxWidth: '100%' }}>
                          <div className="slim-picker">
                            <CustomSelect 
                              options={priorityOptions} 
                              value={task.priority} 
                              onChange={(val) => updateTaskField(idx, 'priority', val)} 
                            />
                          </div>
                        </div>

                        {/* Group Picker (Slim) */}
                        <div style={{ flexShrink: 0, minWidth: '120px', maxWidth: '100%' }}>
                          <div className="slim-picker">
                            <CustomSelect 
                              options={groupOptions} 
                              value={task.group} 
                              onChange={(val) => updateTaskField(idx, 'group', val)} 
                            />
                          </div>
                        </div>

                        {/* Type Picker (Slim) */}
                        <div style={{ flexShrink: 0, minWidth: '120px', maxWidth: '100%' }}>
                          <div className="slim-picker">
                            <CustomSelect 
                              options={typeOptions} 
                              value={task.type || ''} 
                              onChange={(val) => updateTaskField(idx, 'type', val)} 
                              placeholder={t('task_type') || "Type"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', flexShrink: 0, marginTop: '0.1rem' }}>
                      <button 
                        onClick={() => {
                          const updated = [...importedTasks];
                          updated[idx].sendEmail = updated[idx].sendEmail === null ? (userSettings?.emailReminders ?? false) : !updated[idx].sendEmail;
                          setImportedTasks(updated);
                        }}
                        disabled={!task.enabled}
                        style={{ 
                          padding: '0.45rem', borderRadius: 'var(--radius-md)', 
                          background: (task.sendEmail ?? userSettings?.emailReminders) ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2)',
                          color: (task.sendEmail ?? userSettings?.emailReminders) ? 'var(--color-primary-light)' : 'var(--color-text-faint)',
                          border: 'none',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        title={t('send_reminder')}
                      >
                        <Mail size={15} />
                      </button>
                      <button 
                        onClick={() => {
                          const updated = [...importedTasks];
                          updated[idx].addToCalendar = updated[idx].addToCalendar === null ? (userSettings?.calendarIntegration ?? false) : !updated[idx].addToCalendar;
                          setImportedTasks(updated);
                        }}
                        disabled={!userSettings?.googleRefreshToken || !task.enabled}
                        style={{ 
                          padding: '0.45rem', borderRadius: 'var(--radius-md)', 
                          background: (task.addToCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? 'rgba(34,197,94,0.1)' : 'var(--color-surface-2)',
                          color: (task.addToCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? '#22c55e' : 'var(--color-text-faint)',
                          border: 'none',
                          cursor: userSettings?.googleRefreshToken ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                        }}
                        title={t('add_to_calendar')}
                      >
                        <CalendarIcon size={15} />
                      </button>
                      <button 
                        onClick={() => removeTask(idx)}
                        style={{ 
                          padding: '0.45rem', borderRadius: 'var(--radius-md)', 
                          background: 'var(--color-surface-2)',
                          color: 'var(--color-text-faint)',
                          border: 'none',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-faint)')}
                        title={t('delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', position: 'sticky', bottom: 0, background: 'var(--color-surface-0)', padding: '1rem 0 0', marginTop: 'auto', zIndex: 10 }}>
                <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ flex: 1 }}>{t('back')}</button>
                <button 
                  onClick={handleImport} 
                  disabled={processing || importedTasks.filter(item => item.enabled).length === 0} 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center', gap: '0.5rem' }}
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {t('ia_confirm_import', { count: importedTasks.filter(item => item.enabled).length })}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
