import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendTaskReminderEmail } from '@/app/actions/notifications';
import { UserSettings, Task } from '@/types/index';

// Vercel Cron Job hits this route on schedule: "0 0 * * *" (configured in vercel.json)
// It scans all tasks with pending reminders and sends emails based on Lead Days.

export async function GET(req: NextRequest) {
  // ── Security: validate cron secret ─────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowUTC = DateTime.utc();
  let emailsSent = 0;
  let tasksChecked = 0;
  const errors: string[] = [];

  try {
    // ── 1. Load all user settings where emailReminders = true ─
    const settingsSnap = await getDocs(
      query(collection(db, 'userSettings'), where('emailReminders', '==', true))
    );

    for (const settingsDoc of settingsSnap.docs) {
      const settings = { ...settingsDoc.data(), uid: settingsDoc.id } as UserSettings;
      const { uid, notificationEmail, reminderLeadDays, timezone, language, priorityFilter, groupFilter } = settings;

      // ── 1.1 Load Categories for enrichment ─────────────
      const [priSnap, grpSnap, typSnap] = await Promise.all([
        getDocs(query(collection(db, 'priorities'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'groups'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'taskTypes'), where('userId', '==', uid))),
      ]);
      const priMap = Object.fromEntries(priSnap.docs.map(d => [d.id, d.data().name]));
      const grpMap = Object.fromEntries(grpSnap.docs.map(d => [d.id, d.data().name]));
      const typMap = Object.fromEntries(typSnap.docs.map(d => [d.id, d.data().name]));

      // ── 2. Load pending tasks for this user ──────────────────
      const tasksSnap = await getDocs(
        query(
          collection(db, 'tasks'),
          where('userId', '==', uid),
          where('completed', '==', false),
          where('emailReminderSent', '==', false),
        )
      );

      const pendingTasks = tasksSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Task))
        .filter((t) => t.dueDate !== null);

      for (const task of pendingTasks) {
        tasksChecked++;
        const { id: taskId, title, dueDate, priorityId, groupId, typeId, sendEmailReminder } = task;

        // Skip if per-task flag explicitly set to false
        if (sendEmailReminder === false) continue;

        // ── 3. Apply priority/group filters ──────────────────────
        if (priorityFilter?.length > 0 && !priorityFilter.includes(priorityId)) continue;
        if (groupFilter?.length > 0 && !groupFilter.includes(groupId)) continue;

        // ── 4. Calculate if it's the right day to remind ──────────
        const userTz = timezone || 'UTC';
        const today = nowUTC.setZone(userTz).startOf('day');
        const taskDate = DateTime.fromISO(dueDate!, { zone: userTz }).startOf('day');

        const diff = taskDate.diff(today, 'days').days;
        const roundedDiff = Math.round(diff);

        // If roundedDiff matches reminderLeadDays, we send it.
        // Example: today is 15th, task is 16th -> diff is 1. If leadDays is 1, match!
        if (roundedDiff !== (reminderLeadDays ?? 1)) continue;

        // ── 5. Send the reminder email ────────────────────────────
        try {
          const result = await sendTaskReminderEmail({
            to: notificationEmail,
            taskTitle: title,
            dueDate: dueDate!,
            taskId,
            language: language as 'en' | 'es',
            priorityName: priMap[priorityId],
            groupName: grpMap[groupId],
            taskTypeName: typeId ? typMap[typeId] : undefined,
          });

          if (result.success) {
            // Mark as sent so we don't re-send on the next cron run
            await updateDoc(doc(db, 'tasks', taskId), { emailReminderSent: true });
            emailsSent++;
          } else {
            errors.push(`Task ${taskId}: ${result.error}`);
          }
        } catch (e) {
          errors.push(`Task ${taskId}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    const summary = {
      timestamp: nowUTC.toISO(),
      tasksChecked,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
