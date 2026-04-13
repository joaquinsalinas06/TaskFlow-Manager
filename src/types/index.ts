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

export interface Task {
  id: string;
  userId: string;
  title: string;
  priorityId: string;
  groupId: string;
  dueDate: string | null;
  completed?: boolean;
  createdAt: Timestamp;
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
  reminderLeadHours: number;          // Hours before due date to send reminder (e.g. 24)
  calendarIntegration: boolean;       // Master toggle for Google Calendar
  googleRefreshToken: string | null;  // Persisted refresh token for Calendar API
  googleAccessToken: string | null;   // Short-lived access token (cached)
  googleTokenExpiry: number | null;   // Epoch ms when access token expires
  googleEmail?: string | null;        // Email returned from Google for the calendar
  timezone: string;                   // IANA tz string e.g. "America/Mexico_City"
  language: 'en' | 'es';              // Language for notifications
  priorityFilter: string[];           // Priority IDs that trigger notifications (empty = all)
  groupFilter: string[];              // Group IDs that trigger notifications (empty = all)
  updatedAt: Timestamp;
}
