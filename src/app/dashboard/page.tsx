'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePriorities } from '@/hooks/usePriorities';
import { useGroups } from '@/hooks/useGroups';
import { useTasks } from '@/hooks/useTasks';
import { useUserSettings } from '@/hooks/useUserSettings';
import Sidebar from '@/components/dashboard/Sidebar';
import MainContent from '@/components/dashboard/MainContent';
import SettingsPageClient from './settings/SettingsPageClient';

type View = 'dashboard' | 'settings';

export default function DashboardPage() {
  const { user } = useAuth();
  const { priorities, loading: priLoad, createPriority, updatePriorityOrder, deletePriority, updatePriority } = usePriorities(user?.uid);
  const { groups, loading: groupLoad, createGroup, deleteGroup, updateGroup } = useGroups(user?.uid);
  const { tasks, loading: taskLoad, createTask, deleteTask, toggleTaskCompletion } = useTasks(user?.uid);
  const { settings } = useUserSettings();

  const [view, setView] = useState<View>('dashboard');

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Record<string, any[]>> = {};
    priorities.forEach((priority) => {
      grouped[priority.id] = {};
      groups.forEach((group) => {
        grouped[priority.id][group.id] = tasks.filter(
          (t) => t.priorityId === priority.id && t.groupId === group.id
        );
      });
    });
    return grouped;
  }, [priorities, groups, tasks]);

  const loading = priLoad || groupLoad || taskLoad;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--color-surface-0)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            border: '2.5px solid var(--color-surface-4)',
            borderTopColor: 'var(--color-primary)', display: 'inline-block',
          }} className="animate-spin" />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Loading your tasks…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', background: 'var(--color-surface-0)' }}>
      <Sidebar
        priorities={priorities}
        groups={groups}
        groupedTasks={groupedTasks}
        onCreatePriority={createPriority}
        onCreateGroup={createGroup}
        onUpdatePriorityOrder={updatePriorityOrder}
        onDeletePriority={deletePriority}
        onUpdatePriority={updatePriority}
        onUpdateGroup={updateGroup}
        activeView={view}
        onNavigate={setView}
      />

      {view === 'settings' ? (
        <SettingsPageClient priorities={priorities} groups={groups} />
      ) : (
        <MainContent
          priorities={priorities}
          groups={groups}
          groupedTasks={groupedTasks}
          onCreateTask={createTask}
          onDeleteTask={deleteTask}
          onToggleTask={toggleTaskCompletion}
          userSettings={settings}
        />
      )}
    </div>
  );
}
