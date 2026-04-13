'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import { Priority, Group } from '@/types/index';
import CustomSelect from '@/components/shared/CustomSelect';
import { Mail, Calendar as CalendarIcon, Settings as SettingsIcon, Filter, Check, Save, Target, ChevronLeft, Globe } from 'lucide-react';

interface SettingsPageClientProps {
  priorities: Priority[];
  groups: Group[];
}

const LEAD_HOUR_OPTIONS = [
  { value: '1',  labelKey: 'reminder_lead_1h' },
  { value: '3',  labelKey: 'reminder_lead_3h' },
  { value: '6',  labelKey: 'reminder_lead_6h' },
  { value: '12', labelKey: 'reminder_lead_12h' },
  { value: '24', labelKey: 'reminder_lead_24h' },
  { value: '48', labelKey: 'reminder_lead_48h' },
  { value: '72', labelKey: 'reminder_lead_72h' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language_en' },
  { value: 'es', labelKey: 'language_es' },
];

// ─── Small reusable Toggle ───────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: '42px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: checked ? 'var(--color-primary)' : 'var(--color-surface-4)',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '21px' : '3px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ─── Section Card wrapper ────────────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface-1)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--color-border)',
    }}>
      {children}
    </div>
  );
}

// ─── Filter Pill list (multi-select) ─────────────────────────────────────────
function FilterPills({
  items,
  selected,
  onChange,
  getColor,
}: {
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  getColor?: (id: string) => string | undefined;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (items.length === 0) return (
    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>—</p>
  );

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {items.map((item) => {
        const active = selected.includes(item.id);
        const color = getColor?.(item.id) ?? '#6366f1';
        return (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
              background: active ? `${color}22` : 'transparent',
              color: active ? color : 'var(--color-text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {getColor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />}
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Settings Client Component ─────────────────────────────────────────
export default function SettingsPageClient({ priorities, groups }: SettingsPageClientProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
    const {
    settings,
    loading,
    updateSettings,
    refreshSettings,
    isCalendarConnected,
    disconnectCalendar,
  } = useUserSettings();

  // Local draft state — only persist to Firestore on Save
  const [email, setEmail] = useState('');
  const [emailReminders, setEmailReminders] = useState(false);
  const [leadHours, setLeadHours] = useState('24');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [calendarAuto, setCalendarAuto] = useState(false);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialSyncDone = useRef(false);

  // Sync local draft from settings when loaded
  useEffect(() => {
    if (!settings || initialSyncDone.current) return;
    initialSyncDone.current = true;
    setEmail(settings.notificationEmail);
    setEmailReminders(settings.emailReminders);
    setLeadHours(String(settings.reminderLeadHours));
    setLanguage(settings.language || 'en');
    setPriorityFilter(settings.priorityFilter);
    setGroupFilter(settings.groupFilter);
    setCalendarAuto(settings.calendarIntegration);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      notificationEmail: email,
      emailReminders,
      reminderLeadHours: Number(leadHours),
      language,
      priorityFilter,
      groupFilter,
      calendarIntegration: isCalendarConnected ? calendarAuto : false,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Google Identity Services Calendar Connect ────────────────────────────
  const handleConnectCalendar = () => {
    if (!user?.uid) return;
    setCalendarError('');
    setCalendarConnecting(true);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      setCalendarError('Google Client ID not configured');
      setCalendarConnecting(false);
      return;
    }

    // Dynamically load GIS SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      // @ts-expect-error — GIS global
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        ux_mode: 'popup',
        callback: async (response: { code?: string; error?: string }) => {
          if (response.error || !response.code) {
            setCalendarError(response.error ?? t('calendar_connect_error'));
            setCalendarConnecting(false);
            return;
          }
          try {
            const res = await fetch('/api/auth/google-calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: response.code, uid: user.uid }),
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error ?? 'Unknown error');
            }
            // Refresh settings
            await refreshSettings();
            setCalendarAuto(true);
          } catch (err) {
            setCalendarError(err instanceof Error ? err.message : t('calendar_connect_error'));
          } finally {
            setCalendarConnecting(false);
          }
        },
      });
      client.requestCode();
    };
    script.onerror = () => {
      setCalendarError('Failed to load Google SDK');
      setCalendarConnecting(false);
    };
    document.body.appendChild(script);
  };

  const handleDisconnect = async () => {
    await disconnectCalendar();
    setCalendarAuto(false);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%',
          border: '2.5px solid var(--color-surface-4)', borderTopColor: 'var(--color-primary)',
        }} className="animate-spin" />
      </div>
    );
  }

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--color-border)',
    gap: '1rem',
  };
  const sectionBodyStyle: React.CSSProperties = { padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' };
  const labelStyle: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' };

  return (
    <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-surface-0)' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-surface-1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '2rem 2rem 1.5rem',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => document.getElementById('sidebar-settings-btn')?.click()}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ borderLeft: '1px solid var(--color-border)', height: '40px' }} />
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              <SettingsIcon size={24} color="var(--color-primary)" />
              {t('settings_title')}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {t('settings_subtitle')}
            </p>
          </div>
        </div>
        <button
          id="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ gap: '0.4rem' }}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} className="animate-spin" />
              {t('saving')}
            </span>
          ) : saved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={14} />
              {t('settings_saved')}
            </span>
          ) : (
            <>
              <Save size={16} />
              {t('save')}
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '2rem', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        alignItems: 'flex-start'
      }}>
        
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ── Email Notifications ─────────────────────────────────── */}
          <SectionCard>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <Mail size={18} color="var(--color-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('notifications_section')}</h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t('notifications_desc')}</p>
              </div>
            <Toggle id="toggle-email-reminders" checked={emailReminders} onChange={setEmailReminders} />
          </div>

          {emailReminders && (
            <div style={sectionBodyStyle}>
              {/* Email input */}
              <div>
                <label htmlFor="notification-email" style={labelStyle}>{t('notification_email_label')}</label>
                <input
                  id="notification-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              {/* Lead hours */}
              <div>
                <CustomSelect
                  label={t('reminder_lead_label')}
                  value={leadHours}
                  onChange={setLeadHours}
                  options={LEAD_HOUR_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Notification Filters ────────────────────────────────── */}
        {emailReminders && (
          <SectionCard>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <Filter size={18} color="var(--color-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('filters_section')}</h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t('filters_desc')}</p>
              </div>
            </div>
            <div style={sectionBodyStyle}>
              <div>
                <label style={labelStyle}>{t('priority_filter_label')}</label>
                <FilterPills
                  items={priorities}
                  selected={priorityFilter}
                  onChange={setPriorityFilter}
                  getColor={(id) => priorities.find(p => p.id === id)?.color}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('group_filter_label')}</label>
                <FilterPills
                  items={groups}
                  selected={groupFilter}
                  onChange={setGroupFilter}
                  getColor={(id) => groups.find(g => g.id === id)?.color}
                />
              </div>
            </div>
          </SectionCard>
        )}

          {/* ── Language ────────────────────────────────────────────── */}
          {emailReminders && (
            <SectionCard>
              <div style={sectionHeaderStyle}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <Globe size={18} color="var(--color-primary)" />
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('language_label')}</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Language used in email notifications
                  </p>
                </div>
              </div>
              <div style={sectionBodyStyle}>
                <CustomSelect
                  value={language}
                  onChange={(val) => setLanguage(val as 'en' | 'es')}
                  options={LANGUAGE_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                />
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ── Google Calendar ─────────────────────────────────────── */}
          <SectionCard>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <CalendarIcon size={18} color="var(--color-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t('calendar_section')}</h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t('calendar_desc')}</p>
              </div>
            {/* Connection status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isCalendarConnected ? '#22c55e' : 'var(--color-text-faint)',
              }} />
              <span style={{ fontSize: '0.75rem', color: isCalendarConnected ? '#22c55e' : 'var(--color-text-faint)', fontWeight: 600 }}>
                {isCalendarConnected ? t('calendar_connected') : t('calendar_not_connected')}
              </span>
            </div>
          </div>

          <div style={sectionBodyStyle}>
            {calendarError && (
              <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.82rem' }}>
                {calendarError}
              </div>
            )}

            {!isCalendarConnected ? (
              <button
                id="connect-calendar-btn"
                className="btn btn-primary"
                onClick={handleConnectCalendar}
                disabled={calendarConnecting}
                style={{ alignSelf: 'flex-start', gap: '0.5rem' }}
              >
                {/* Google icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {calendarConnecting ? t('calendar_connecting') : t('connect_calendar')}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {settings?.googleEmail && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-base)', background: 'var(--color-surface-2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('linked_account')}</span> <strong>{settings.googleEmail}</strong>
                  </div>
                )}
                {/* Auto-create toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label htmlFor="toggle-calendar-auto" style={{ fontSize: '0.875rem', color: 'var(--color-text-base)', cursor: 'pointer' }}>
                    {t('calendar_toggle')}
                  </label>
                  <Toggle id="toggle-calendar-auto" checked={calendarAuto} onChange={setCalendarAuto} />
                </div>
                {/* Disconnect */}
                <button
                  id="disconnect-calendar-btn"
                  className="btn btn-ghost"
                  onClick={handleDisconnect}
                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--color-danger, #ef4444)' }}
                >
                  {t('disconnect_calendar')}
                </button>
              </div>
            )}
          </div>
        </SectionCard>
        </div>
      </div>
    </main>
  );
}
