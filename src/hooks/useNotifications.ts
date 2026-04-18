// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { Notification, Priority, Group } from '@/types/index';
import { getNotifications, respondToInvitation, getPrioritiesByUser, getGroupsByUser } from '@/lib/firestore';

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    
    // Polling or just fetch once? For now fetch on mount and after actions.
    // Ideally use onSnapshot for real-time.
  }, [fetchNotifications]);

  const acceptInvitation = async (
    notificationId: string, 
    priorityId: string, 
    groupId: string
  ) => {
    if (!userId) return;
    await respondToInvitation(notificationId, 'accepted', {
      userId,
      priorityId,
      groupId
    });
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const rejectInvitation = async (notificationId: string) => {
    await respondToInvitation(notificationId, 'rejected');
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    notifications,
    loading,
    acceptInvitation,
    rejectInvitation,
    refresh: fetchNotifications
  };
};
