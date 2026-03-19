import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/twitter/callback";

export async function GET(request: NextRequest) {
  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for verification
  cookies().set("twitter_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  // Twitter OAuth 2.0 authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_CALLBACK_URL,
    scope: "tweet.read users.read",
    state,
    code_challenge: "challenge",
    code_challenge_method: "plain",
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
