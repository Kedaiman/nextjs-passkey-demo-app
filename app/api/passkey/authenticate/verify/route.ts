import db from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";
import {
  AuthenticationResponseJSON,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AUTH_SESSION_COOKIE = "auth_session";

export async function POST(req: NextRequest) {
  const authCookie = req.cookies.get(AUTH_SESSION_COOKIE)?.value || "";
  if (!authCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const requestCredential = (await req.json()) as AuthenticationResponseJSON;

  // 期待値の設定
  const expectedOrigin = req.nextUrl.origin;
  const expectedRPID = (req.headers.get("host") || "localhost").split(":")[0];
  const authChallengeData = db
    .prepare("SELECT challenge FROM auth_challenges WHERE id = ?")
    .get(authCookie) as { challenge: string } | undefined;
  const expectedChallenge = authChallengeData?.challenge;
  if (!expectedChallenge) {
    return new Response(JSON.stringify({ error: "Challenge not found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // DBにの存済みの公開鍵をクレデンシャルIDから取得
  const credentialData = db
    .prepare("SELECT public_key, user_id FROM credentials WHERE id = ?")
    .get(requestCredential.id) as
    | { public_key: string; user_id: string }
    | undefined;
  const publicKey = credentialData?.public_key;
  if (!publicKey) {
    return new Response(JSON.stringify({ error: "Credential not found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const verification = await verifyAuthenticationResponse({
    response: requestCredential,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: requestCredential.id,
      publicKey: isoBase64URL.toBuffer(publicKey),
      counter: 0,
    },
    requireUserVerification: true,
  });

  const { verified, authenticationInfo } = verification;
  if (!verified) {
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 最終利用日時の更新
  db.prepare(
    "UPDATE credentials SET last_used = ?, counter = ? WHERE id = ?",
  ).run(
    new Date().getTime(),
    authenticationInfo.newCounter,
    requestCredential.id,
  );

  // 認証成功したユーザIDからユーザ情報を取得してセッションを発行
  const user = db
    .prepare("SELECT id, email FROM users WHERE id = ?")
    .get(credentialData.user_id) as { id: string; email: string } | undefined;
  if (!user) {
    // 実際にはクレデンシャルが存在する場合はユーザも存在するはずなので、ここに来るのは異常系
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await createSession({ userId: user.id, email: user.email });
  const response = NextResponse.json({ ok: true });
  return setSessionCookie(response, token);
}
