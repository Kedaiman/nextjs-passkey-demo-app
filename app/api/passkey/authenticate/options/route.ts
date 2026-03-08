import db from "@/lib/db";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AUTH_SESSION_COOKIE = "auth_session";
const EXPIRES_IN = 1 * 60; // 1分

export async function POST(req: NextRequest) {
  const rpId = (req.headers.get("host") || "localhost").split(":")[0];

  // 認証オプションの生成
  const options = await generateAuthenticationOptions({
    rpID: rpId,
    allowCredentials: [],
    timeout: 60000,
    userVerification: "required",
  });

  // 認証用のチャレンジ情報をDBに保存し、クライアントにはセッションIDをCookieで渡す
  const sessionId = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRES_IN;
  db.prepare(
    "INSERT INTO auth_challenges (id, challenge, expires_at) VALUES (?, ?, ?)",
  ).run(sessionId, options.challenge, expiresAt);

  const response = NextResponse.json(options);
  response.headers.append(
    "Set-Cookie",
    `${AUTH_SESSION_COOKIE}=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${EXPIRES_IN}`,
  );
  return response;
}
