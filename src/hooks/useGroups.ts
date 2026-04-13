import { useEffect, useState, useCallback, useRef } from 'react';
import { Group } from '@/types/index';
import {
  getGroupsByUser,
  createGroup as firestoreCreateGroup,
  updateGroupOrder as firestoreUpdateGroupOrder,
  updateGroup as firestoreUpdateGroup,
  deleteGroup as firestoreDeleteGroup,
} from '@/lib/firestore';

export const useGroups = (userId: string | undefined) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch groups on userId change
  useEffect(() => {
    if (!userId) {
      setGroups([]);
      return;
    }

    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await getGroupsByUser(userId);
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [userId]);

  const createGroup = useCallback(
    async (name: string) => {
      if (!userId) throw new Error('User not authenticated');
      try {
        const newGroup = await firestoreCreateGroup(userId, name);
        setGroups((prev) => [...prev, newGroup].sort((a, b) => (a.order || 0) - (b.order || 0)));
        return newGroup;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId]
  );

  const updateOrderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const updateGroupOrder = useCallback(
    async (newGroups: Group[]) => {
      // 1. Optimistic
      setGroups(newGroups);
      
      // 2. Clear
      if (updateOrderTimeoutRef.current) clearTimeout(updateOrderTimeoutRef.current);
      
      // 3. Debounce
      updateOrderTimeoutRef.current = setTimeout(async () => {
        try {
          await firestoreUpdateGroupOrder(newGroups);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const updateGroup = useCallback(
    async (groupId: string, data: Partial<Group>) => {
      // 1. Optimistic Update (Immediate)
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, ...data } : g))
      );

      // 2. Clear pending timeout
      if (updateTimeoutRef.current[groupId]) {
        clearTimeout(updateTimeoutRef.current[groupId]);
      }

      // 3. Debounce network call for 500ms
      updateTimeoutRef.current[groupId] = setTimeout(async () => {
        try {
          await firestoreUpdateGroup(groupId, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }, 500);
    },
    []
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      try {
        await firestoreDeleteGroup(groupId);
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    []
  );

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroupOrder,
    updateGroup,
    deleteGroup,
  };
};
