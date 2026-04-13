'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserSettings } from '@/types/index';
import { getUserSettings, updateUserSettings } from '@/lib/firestore';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (patch: Partial<Omit<UserSettings, 'uid'>>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isCalendarConnected: boolean;
  isCalendarTokenExpired: boolean;
  disconnectCalendar: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setSettings(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserSettings(user.uid, user.email ?? '');
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = useCallback(
    async (patch: Partial<Omit<UserSettings, 'uid'>>) => {
      if (!user?.uid) return;
      // Optimistic update
      setSettings((prev) => prev ? { ...prev, ...patch } : prev);
      try {
        await updateUserSettings(user.uid, patch);
      } catch (err) {
        // Revert on failure
        setError(err instanceof Error ? err : new Error(String(err)));
        // Re-load to restore truth
        const data = await getUserSettings(user.uid, user.email ?? '');
        setSettings(data);
      }
    },
    [user?.uid, user?.email]
  );

  const disconnectCalendar = useCallback(async () => {
    await updateSettings({
      calendarIntegration: false,
      googleRefreshToken: null,
      googleAccessToken: null,
      googleTokenExpiry: null,
    });
  }, [updateSettings]);

  const isCalendarConnected = Boolean(settings?.calendarIntegration && settings?.googleRefreshToken);

  const isCalendarTokenExpired = Boolean(
    settings?.googleTokenExpiry && Date.now() > settings.googleTokenExpiry
  );

  const refreshSettings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getUserSettings(user.uid, user.email ?? '');
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [user?.uid, user?.email]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
    isCalendarConnected,
    isCalendarTokenExpired,
    disconnectCalendar,
  };
}
