import { useEffect, useState, useCallback, useRef } from 'react';
import { Task, ChecklistItem } from '@/types/index';
import {
  getTasksByUser,
  createTask as firestoreCreateTask,
  updateTask as firestoreUpdateTask,
  toggleTaskCompletion as firestoreToggleTaskCompletion,
  deleteTask as firestoreDeleteTask,
} from '@/lib/firestore';
import { createCalendarEvent } from '@/app/actions/calendar';
import { useUserSettings } from '@/hooks/useUserSettings';

export const useTasks = (userId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { settings, updateSettings } = useUserSettings();

  // Fetch tasks on userId change
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const data = await getTasksByUser(userId);
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  const createTask = useCallback(
    async (
      title: string,
      priorityId: string,
      groupId: string,
      dueDate: string | null = null,
      sendEmailReminder: boolean | null = null,
      addToCalendar: boolean | null = null,
      description: string | null = null,
      links: string[] = [],
      checklistItems: ChecklistItem[] = [],
      priorityName?: string,
      groupName?: string,
      typeId: string | null = null,
      typeName?: string
    ) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        const newTask = await firestoreCreateTask(
          userId, title, priorityId, groupId, typeId, dueDate, sendEmailReminder, addToCalendar, description, links, checklistItems
        );
        setTasks((prev) => [newTask, ...prev]);

        // ── Calendar integration (fire-and-forget after UI update) ────
        if (
          dueDate &&
          addToCalendar !== false &&
          (addToCalendar === true || settings?.calendarIntegration) &&
          settings?.googleRefreshToken
        ) {
          import('@/app/actions/calendar').then(({ createCalendarEvent }) => {
            createCalendarEvent(
              {
                accessToken: settings.googleAccessToken,
                accessTokenExpiry: settings.googleTokenExpiry,
                refreshToken: settings.googleRefreshToken!,
              },
              title,
              dueDate,
              description ?? undefined,
              priorityName,
              groupName,
              links,
              checklistItems,
              typeName
            ).then(async (result) => {
              if (result.success && result.eventId) {
                // Save the calendar event ID back to the task
                await firestoreUpdateTask(newTask.id, { calendarEventId: result.eventId });
                setTasks((prev) =>
                  prev.map((t) => t.id === newTask.id ? { ...t, calendarEventId: result.eventId } : t)
                );
                // Persist refreshed token if googleapis silently renewed it
                if (result.newAccessToken && userId) {
                  await updateSettings({
                    googleAccessToken: result.newAccessToken,
                    googleTokenExpiry: result.newAccessTokenExpiry ?? null,
                  });
                }
              } else if (result.error) {
                console.error('[useTasks] Calendar event creation failed:', result.error);
              }
            }).catch((err) => {
              console.error('[useTasks] Calendar error:', err);
            });
          });
        }

        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId, settings, updateSettings]
  );

  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const toggleTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const updateTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      // Optimistic
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...data } : t))
      );

      // Debounce
      if (updateTimeoutRef.current[taskId]) clearTimeout(updateTimeoutRef.current[taskId]);
      updateTimeoutRef.current[taskId] = setTimeout(async () => {
        try {
          await firestoreUpdateTask(taskId, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const toggleTaskCompletion = useCallback(
    async (taskId: string, completed: boolean) => {
      // Optimistic
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t))
      );

      // Debounce
      if (toggleTimeoutRef.current[taskId]) clearTimeout(toggleTimeoutRef.current[taskId]);
      toggleTimeoutRef.current[taskId] = setTimeout(async () => {
        try {
          await firestoreToggleTaskCompletion(taskId, completed);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const taskToDelete = tasks.find(t => t.id === taskId);
        await firestoreDeleteTask(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        
        // Ensure Calendar deletion happens if it was synced
        if (taskToDelete?.calendarEventId && settings?.googleRefreshToken) {
          import('@/app/actions/calendar').then(({ deleteCalendarEvent }) => {
            deleteCalendarEvent({
              accessToken: settings.googleAccessToken,
              accessTokenExpiry: settings.googleTokenExpiry,
              refreshToken: settings.googleRefreshToken!,
            }, taskToDelete.calendarEventId!);
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [tasks, settings]
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
  };
};
