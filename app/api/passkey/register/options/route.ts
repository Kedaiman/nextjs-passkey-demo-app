import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RP_NAME = "Passkey Demo";
// Vercel であれば環境変数 VERCEL_URL が設定される（例: "my-app.vercel.app"）。ローカル開発環境では "localhost" を使用。
const RP_ID = process.env.VERCEL_URL || "localhost";

type PasskeyRow = { credential_id: string };

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 登録済みパスキーを取得（再登録を防ぐため excludeCredentials に渡す）
  const existingPasskeys = db
    .prepare("SELECT credential_id FROM passkeys WHERE user_id = ?")
    .all(session.userId) as PasskeyRow[];

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: session.email,
    attestationType: "none",
    excludeCredentials: existingPasskeys.map((p) => ({ id: p.credential_id })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  // チャレンジをDBに保存（upsert）
  db.prepare(
    "INSERT INTO challenges (user_id, challenge, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET challenge = excluded.challenge, created_at = excluded.created_at",
  ).run(session.userId, options.challenge, new Date().toISOString());

  return NextResponse.json(options);
}
