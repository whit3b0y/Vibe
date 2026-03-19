import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/twitter/callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/sell?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Verify state
  const storedState = cookies().get("twitter_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/sell?error=invalid_state", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/sell?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: "challenge",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token");
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=public_metrics",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await userResponse.json();
    const user = userData.data;

    // Store Twitter info in cookie
    cookies().set(
      "twitter_user",
      JSON.stringify({
        handle: user.username,
        followers: user.public_metrics?.followers_count || 0,
      }),
      {
        httpOnly: false, // Allow JS access
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      }
    );

    // Clear state cookie
    cookies().delete("twitter_oauth_state");

    return NextResponse.redirect(new URL("/sell?twitter=connected", request.url));
  } catch (error) {
    console.error("Twitter OAuth error:", error);
    return NextResponse.redirect(
      new URL("/sell?error=oauth_failed", request.url)
    );
  }
}
