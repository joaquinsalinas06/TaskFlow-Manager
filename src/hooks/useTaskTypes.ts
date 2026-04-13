import { useEffect, useState, useCallback } from 'react';
import { TaskType } from '@/types/index';
import {
  getTaskTypesByUser,
  createTaskType as firestoreCreateTaskType,
  updateTaskTypeOrder as firestoreUpdateTaskTypeOrder,
  deleteTaskType as firestoreDeleteTaskType,
  updateTaskType as firestoreUpdateTaskType,
} from '@/lib/firestore';

export const useTaskTypes = (userId: string | undefined) => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setTaskTypes([]);
      return;
    }

    const fetchTaskTypes = async () => {
      setLoading(true);
      try {
        const data = await getTaskTypesByUser(userId);
        setTaskTypes(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchTaskTypes();
  }, [userId]);

  const createTaskType = useCallback(
    async (name: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        const newType = await firestoreCreateTaskType(userId, name);
        setTaskTypes((prev) => [...prev, newType]);
        return newType;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId]
  );

  const updateTaskTypeOrder = useCallback(
    async (types: TaskType[]) => {
      setTaskTypes(types); // Optimistic update
      try {
        await firestoreUpdateTaskTypeOrder(types);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  const deleteTaskType = useCallback(
    async (id: string) => {
      try {
        await firestoreDeleteTaskType(id);
        setTaskTypes((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    []
  );

  const updateTaskType = useCallback(
    async (id: string, data: Partial<TaskType>) => {
      setTaskTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      try {
        await firestoreUpdateTaskType(id, data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  return {
    taskTypes,
    loading,
    error,
    createTaskType,
    updateTaskTypeOrder,
    deleteTaskType,
    updateTaskType,
  };
};
