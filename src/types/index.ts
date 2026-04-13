import { Timestamp } from 'firebase/firestore';

export interface Priority {
  id: string;
  userId: string;
  name: string;
  order: number;
  color?: string;
  createdAt: Timestamp;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  order?: number;
  color?: string;
  createdAt: Timestamp;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  priorityId: string;
  groupId: string;
  dueDate: string | null;
  completed?: boolean;
  createdAt: Timestamp;
  // Enrichment fields
  description?: string | null;          // Free-text notes / description
  links?: string[];                     // Relevant URLs
  checklistItems?: ChecklistItem[];     // Mini sub-tasks
  // Notification fields
  sendEmailReminder?: boolean | null;   // null = inherit from UserSettings
  addToCalendar?: boolean | null;       // null = inherit from UserSettings
  calendarEventId?: string | null;      // Google Calendar event ID (for future deletion)
  emailReminderSent?: boolean;          // true once reminder has been dispatched
}

export interface User {
  uid: string;
  email: string | null;
}

export interface UserSettings {
  uid: string;
  notificationEmail: string;          // Destination email for reminders
  emailReminders: boolean;            // Master toggle for email notifications
  reminderLeadDays: number;           // Days before due date to send reminder (e.g. 1)
  calendarIntegration: boolean;       // Master toggle for Google Calendar
  googleRefreshToken: string | null;  // Persisted refresh token for Calendar API
  googleAccessToken: string | null;   // Short-lived access token (cached)
  googleTokenExpiry: number | null;   // Epoch ms when access token expires
  googleEmail?: string | null;        // Email returned from Google for the calendar
  timezone: string;                   // IANA tz string e.g. "America/Mexico_City"
  language: 'en' | 'es';              // Language for notifications
  weekStartsOn?: 1 | 7;               // 1 = Monday, 7 = Sunday
  priorityFilter: string[];           // Priority IDs that trigger notifications (empty = all)
  groupFilter: string[];              // Group IDs that trigger notifications (empty = all)
  updatedAt: Timestamp;
}
