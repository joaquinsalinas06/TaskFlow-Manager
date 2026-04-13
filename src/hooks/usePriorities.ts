import { useEffect, useState, useCallback, useRef } from 'react';
import { Priority } from '@/types/index';
import {
  getPrioritiesByUser,
  createPriority as firestoreCreatePriority,
  updatePriorityOrder as firestoreUpdatePriorityOrder,
  deletePriority as firestoreDeletePriority,
  updatePriority as firestoreUpdatePriority,
} from '@/lib/firestore';

export const usePriorities = (userId: string | undefined) => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch priorities on userId change
  useEffect(() => {
    if (!userId) {
      setPriorities([]);
      return;
    }

    const fetchPriorities = async () => {
      setLoading(true);
      try {
        const data = await getPrioritiesByUser(userId);
        setPriorities(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, [userId]);

  const createPriority = useCallback(
    async (name: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        const newPriority = await firestoreCreatePriority(userId, name);
        setPriorities((prev) => [...prev, newPriority].sort((a, b) => a.order - b.order));
        return newPriority;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId]
  );

  const updateOrderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const updatePriorityOrder = useCallback(
    async (newPriorities: Priority[]) => {
      // 1. Optimistic
      setPriorities(newPriorities);
      
      // 2. Clear
      if (updateOrderTimeoutRef.current) clearTimeout(updateOrderTimeoutRef.current);
      
      // 3. Debounce
      updateOrderTimeoutRef.current = setTimeout(async () => {
        try {
          await firestoreUpdatePriorityOrder(newPriorities);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const updatePriority = useCallback(
    async (priorityId: string, data: Partial<Priority>) => {
      // Optimistic
      setPriorities((prev) =>
        prev.map((p) => (p.id === priorityId ? { ...p, ...data } : p))
      );

      // Debounce
      if (updateTimeoutRef.current[priorityId]) {
        clearTimeout(updateTimeoutRef.current[priorityId]);
      }
      updateTimeoutRef.current[priorityId] = setTimeout(async () => {
        try {
          await firestoreUpdatePriority(priorityId, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const deletePriority = useCallback(
    async (priorityId: string) => {
      try {
        await firestoreDeletePriority(priorityId);
        setPriorities((prev) => prev.filter((p) => p.id !== priorityId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    []
  );

  return {
    priorities,
    loading,
    error,
    createPriority,
    updatePriorityOrder,
    updatePriority,
    deletePriority,
  };
};
