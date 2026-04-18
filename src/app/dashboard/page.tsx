'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePriorities } from '@/hooks/usePriorities';
import { useGroups } from '@/hooks/useGroups';
import { useTaskTypes } from '@/hooks/useTaskTypes';
import { useTasks } from '@/hooks/useTasks';
import { useUserSettings } from '@/hooks/useUserSettings';
import Sidebar from '@/components/dashboard/Sidebar';
import MainContent from '@/components/dashboard/MainContent';
import SettingsPageClient from './settings/SettingsPageClient';
import { SidebarSkeleton, MainContentSkeleton } from '@/components/shared/Skeletons';

type View = 'dashboard' | 'settings';
type DashboardLayout = "board" | "calendar" | "analytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    priorities,
    loading: priLoad,
    createPriority,
    updatePriorityOrder,
    deletePriority,
    updatePriority,
  } = usePriorities(user?.uid);
  const {
    groups,
    loading: groupLoad,
    createGroup,
    updateGroupOrder,
    deleteGroup,
    updateGroup,
  } = useGroups(user?.uid);
  const {
    taskTypes,
    loading: typeLoad,
    createTaskType,
    updateTaskTypeOrder,
    deleteTaskType,
    updateTaskType,
  } = useTaskTypes(user?.uid);
  const {
    tasks,
    loading: taskLoad,
    createTask,
    deleteTask,
    toggleTaskCompletion,
    updateTask,
  } = useTasks(user?.uid);
  const { settings } = useUserSettings();

  const [view, setView] = useState<View>("dashboard");
  const [dashboardLayout, setDashboardLayout] =
    useState<DashboardLayout>("board");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen and set default collapse state
  useEffect(() => {
    const savedLayout = localStorage.getItem("taskflow.dashboard.layout");
    if (
      savedLayout === "calendar" ||
      savedLayout === "board" ||
      savedLayout === "analytics"
    ) {
      setDashboardLayout(savedLayout);
    }

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem("taskflow.dashboard.layout", dashboardLayout);
  }, [dashboardLayout]);

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Record<string, any[]>> = {};
    priorities.forEach((priority) => {
      grouped[priority.id] = {};
      groups.forEach((group) => {
        grouped[priority.id][group.id] = tasks.filter(
          (t) => t.priorityId === priority.id && t.groupId === group.id,
        );
      });
    });
    return grouped;
  }, [priorities, groups, tasks]);

  const loading = priLoad || groupLoad || typeLoad || taskLoad;

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          background: "var(--color-surface-0)",
        }}
      >
        <SidebarSkeleton />
        <MainContentSkeleton />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        background: "var(--color-surface-0)",
      }}
    >
      <Sidebar
        priorities={priorities}
        groups={groups}
        taskTypes={taskTypes}
        groupedTasks={groupedTasks}
        onCreatePriority={createPriority}
        onCreateGroup={createGroup}
        onCreateTaskType={createTaskType}
        onUpdatePriorityOrder={updatePriorityOrder}
        onUpdateGroupOrder={updateGroupOrder}
        onUpdateTaskTypeOrder={updateTaskTypeOrder}
        onDeletePriority={deletePriority}
        onUpdatePriority={updatePriority}
        onDeleteGroup={deleteGroup}
        onUpdateGroup={updateGroup}
        onDeleteTaskType={deleteTaskType}
        onUpdateTaskType={updateTaskType}
        activeView={view}
        onNavigate={setView}
        dashboardLayout={dashboardLayout}
        onChangeDashboardLayout={setDashboardLayout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobile={isMobile}
      />

      {view === "settings" ? (
        <SettingsPageClient
          priorities={priorities}
          groups={groups}
          isMobile={isMobile}
        />
      ) : (
        <MainContent
          priorities={priorities}
          groups={groups}
          taskTypes={taskTypes}
          groupedTasks={groupedTasks}
          onCreateTask={createTask}
          onCreateGroup={createGroup}
          onCreateTaskType={createTaskType}
          onDeleteTask={deleteTask}
          onToggleTask={toggleTaskCompletion}
          onUpdateTask={updateTask}
          userSettings={settings}
          dashboardLayout={dashboardLayout}
          onChangeDashboardLayout={setDashboardLayout}
          sidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
