'use server';

import { google } from 'googleapis';

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    // redirect_uri not needed for token refresh, only for the initial code exchange
  );
  return client;
}

interface TokenSet {
  accessToken: string | null;
  accessTokenExpiry: number | null; // epoch ms
  refreshToken: string;
}

interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  newAccessToken?: string;
  newAccessTokenExpiry?: number;
  error?: string;
}

/**
 * Creates an all-day Google Calendar event for the given task.
 * Returns the event ID and, if the access token was refreshed, the new tokens.
 */
export async function createCalendarEvent(
  tokens: TokenSet,
  taskTitle: string,
  dueDate: string,       // "YYYY-MM-DD"
  description?: string,
): Promise<CalendarEventResult> {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return { success: false, error: 'Google OAuth not configured on server' };
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.accessTokenExpiry ?? undefined,
    });

    // googleapis will auto-refresh if the access token is expired
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: taskTitle,
        description: description ?? `Task managed by TaskFlow Manager.`,
        // All-day event: use "date" (not "dateTime")
        start: { date: dueDate },
        end: { date: dueDate },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 * 9 }, // 9am popup
          ],
        },
      },
    });

    // Check if the client silently refreshed the access token
    const newCreds = oauth2Client.credentials;
    const result: CalendarEventResult = {
      success: true,
      eventId: response.data.id ?? undefined,
    };
    if (newCreds.access_token && newCreds.access_token !== tokens.accessToken) {
      result.newAccessToken = newCreds.access_token;
      result.newAccessTokenExpiry = (newCreds.expiry_date as number) ?? undefined;
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[calendar] Failed to create event:', message);
    return { success: false, error: message };
  }
}

/**
 * Deletes a Google Calendar event by ID.
 */
export async function deleteCalendarEvent(
  tokens: TokenSet,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return { success: false, error: 'Google OAuth not configured on server' };
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.accessTokenExpiry ?? undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({ calendarId: 'primary', eventId });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[calendar] Failed to delete event:', message);
    return { success: false, error: message };
  }
}
