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

// Vercel Cron Job hits this route on schedule: "0 */6 * * *"
// It scans all tasks with pending reminders and sends emails when within the reminder window.

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
      const { uid, notificationEmail, reminderLeadHours, timezone, language, priorityFilter, groupFilter } = settings;

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
        const { id: taskId, title, dueDate, priorityId, groupId, sendEmailReminder } = task;

        // Skip if per-task flag explicitly set to false
        if (sendEmailReminder === false) continue;

        // ── 3. Apply priority/group filters ──────────────────────
        if (priorityFilter.length > 0 && !priorityFilter.includes(priorityId)) continue;
        if (groupFilter.length > 0 && !groupFilter.includes(groupId)) continue;

        // ── 4. Convert dueDate to UTC using user's timezone ─────
        const userTz = timezone || 'UTC';
        const dueInUserTz = DateTime.fromISO(dueDate!, { zone: userTz }).endOf('day');
        const dueInUTC = dueInUserTz.toUTC();

        // ── 5. Check if we're inside the reminder window ─────────
        const windowStart = dueInUTC.minus({ hours: reminderLeadHours });

        if (nowUTC < windowStart || nowUTC > dueInUTC) continue;

        // ── 6. Send the reminder email ────────────────────────────
        try {
          const result = await sendTaskReminderEmail({
            to: notificationEmail,
            taskTitle: title,
            dueDate: dueDate!,
            taskId,
            language: language as 'en' | 'es',
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
