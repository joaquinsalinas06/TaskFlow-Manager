'use client';

import { usePriorities } from '@/hooks/usePriorities';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import SettingsPageClient from './SettingsPageClient';

export default function SettingsPage() {
  const { user } = useAuth();
  const { priorities } = usePriorities(user?.uid);
  const { groups } = useGroups(user?.uid);

  return <SettingsPageClient priorities={priorities} groups={groups} />;
}
