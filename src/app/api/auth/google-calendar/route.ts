import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This route exchanges a Google authorization_code for access_token + refresh_token
// and persists them in the user's Firestore settings document.
//
// Called from the client after google.accounts.oauth2.initCodeClient() succeeds.
// Body: { code: string, uid: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code?: string; uid?: string };
    const { code, uid } = body;

    if (!code || !uid) {
      return NextResponse.json({ error: 'Missing code or uid' }, { status: 400 });
    }

    if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    // Determine the redirect URI — must match what was used in initCodeClient
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${origin}/api/auth/google-calendar`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri,
    );

    // Exchange the auth code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!refresh_token) {
      // This happens when the user has already granted access before.
      // Instruct the client to revoke and retry with prompt=consent.
      return NextResponse.json(
        { error: 'No refresh_token returned. User may need to revoke access and reconnect.' },
        { status: 422 }
      );
    }

    // Persist tokens in Firestore userSettings/{uid}
    const settingsRef = doc(db, 'userSettings', uid);
    await updateDoc(settingsRef, {
      googleRefreshToken: refresh_token,
      googleAccessToken: access_token ?? null,
      googleTokenExpiry: expiry_date ?? null,
      calendarIntegration: true,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[google-calendar API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handle the OAuth redirect (for the redirect_uri, though we use the popup/code flow)
export async function GET() {
  return NextResponse.json({ ok: true, info: 'Google Calendar OAuth endpoint' });
}
