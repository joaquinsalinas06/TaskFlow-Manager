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
 * Creates a Google Calendar event for the given task.
 * If startTime and endTime are provided, creates a timed event.
 * Otherwise, creates an all-day event.
 * Returns the event ID and, if the access token was refreshed, the new tokens.
 */
export async function createCalendarEvent(
  tokens: TokenSet,
  taskTitle: string,
  dueDate: string,       // "YYYY-MM-DD"
  description?: string | null,
  priorityName?: string,
  groupName?: string,
  links?: string[],
  checklistItems?: { text: string; done: boolean }[],
  taskTypeName?: string,
  startTime?: string,    // "HH:mm" format
  endTime?: string       // "HH:mm" format
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

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build rich HTML description
    let eventDescription = `<b>${taskTitle}</b>`;
    if (priorityName || groupName || taskTypeName) {
      eventDescription += `<br><i>${taskTypeName ? `[${taskTypeName}] ` : ''}${priorityName ?? ''} ${priorityName && groupName ? '·' : ''} ${groupName ?? ''}</i>`;
    }
    
    if (description) {
      eventDescription += `<br><br>${description.replace(/\n/g, '<br>')}`;
    }

    if (links && links.length > 0) {
      eventDescription += `<br><br><b>Links:</b><ul>`;
      links.forEach(link => {
        const href = link.startsWith('http') ? link : `https://${link}`;
        eventDescription += `<li><a href="${href}">${link}</a></li>`;
      });
      eventDescription += `</ul>`;
    }

    if (checklistItems && checklistItems.length > 0) {
      eventDescription += `<br><br><b>Checklist:</b><ul>`;
      checklistItems.forEach(item => {
        eventDescription += `<li>${item.done ? '✓' : '☐'} ${item.text}</li>`;
      });
      eventDescription += `</ul>`;
    }

    eventDescription += `<br><br><small><i>Managed by TaskFlow App</i></small>`;

    // Determine if this is a timed event or all-day event
    let startObj: any;
    let endObj: any;

    if (startTime && endTime) {
      // Timed event: use dateTime with timezone
      const startDateTime = `${dueDate}T${startTime}:00`;
      const endDateTime = `${dueDate}T${endTime}:00`;
      startObj = { dateTime: startDateTime, timeZone: 'America/Mexico_City' };
      endObj = { dateTime: endDateTime, timeZone: 'America/Mexico_City' };
    } else {
      // All-day event: use date
      startObj = { date: dueDate };
      endObj = { date: dueDate };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${taskTypeName ? `[${taskTypeName}] ` : ''}${taskTitle} ${groupName ? `- ${groupName}` : ''}`,
        description: eventDescription,
        start: startObj,
        end: endObj,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: startTime ? 30 : 60 * 9 }, // 30 min before for timed events, 9am for all-day
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

/**
 * Updates a Google Calendar event with new time information.
 * If startTime and endTime are provided, converts to timed event.
 * Otherwise, converts to all-day event.
 */
export async function updateCalendarEvent(
  tokens: TokenSet,
  eventId: string,
  taskTitle: string,
  dueDate: string,       // "YYYY-MM-DD"
  description?: string | null,
  priorityName?: string,
  groupName?: string,
  links?: string[],
  checklistItems?: { text: string; done: boolean }[],
  taskTypeName?: string,
  startTime?: string,    // "HH:mm" format
  endTime?: string       // "HH:mm" format
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

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build rich HTML description (same as createCalendarEvent)
    let eventDescription = `<b>${taskTitle}</b>`;
    if (priorityName || groupName || taskTypeName) {
      eventDescription += `<br><i>${taskTypeName ? `[${taskTypeName}] ` : ''}${priorityName ?? ''} ${priorityName && groupName ? '·' : ''} ${groupName ?? ''}</i>`;
    }
    
    if (description) {
      eventDescription += `<br><br>${description.replace(/\n/g, '<br>')}`;
    }

    if (links && links.length > 0) {
      eventDescription += `<br><br><b>Links:</b><ul>`;
      links.forEach(link => {
        const href = link.startsWith('http') ? link : `https://${link}`;
        eventDescription += `<li><a href="${href}">${link}</a></li>`;
      });
      eventDescription += `</ul>`;
    }

    if (checklistItems && checklistItems.length > 0) {
      eventDescription += `<br><br><b>Checklist:</b><ul>`;
      checklistItems.forEach(item => {
        eventDescription += `<li>${item.done ? '✓' : '☐'} ${item.text}</li>`;
      });
      eventDescription += `</ul>`;
    }

    eventDescription += `<br><br><small><i>Managed by TaskFlow App</i></small>`;

    // Determine if this is a timed event or all-day event
    let startObj: any;
    let endObj: any;

    if (startTime && endTime) {
      // Timed event: use dateTime with timezone
      const startDateTime = `${dueDate}T${startTime}:00`;
      const endDateTime = `${dueDate}T${endTime}:00`;
      startObj = { dateTime: startDateTime, timeZone: 'America/Mexico_City' };
      endObj = { dateTime: endDateTime, timeZone: 'America/Mexico_City' };
    } else {
      // All-day event: use date
      startObj = { date: dueDate };
      endObj = { date: dueDate };
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        summary: `${taskTypeName ? `[${taskTypeName}] ` : ''}${taskTitle} ${groupName ? `- ${groupName}` : ''}`,
        description: eventDescription,
        start: startObj,
        end: endObj,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: startTime ? 30 : 60 * 9 }, // 30 min before for timed events, 9am for all-day
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
    console.error('[calendar] Failed to update event:', message);
    return { success: false, error: message };
  }
}
