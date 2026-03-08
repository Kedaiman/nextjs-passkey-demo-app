import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RP_NAME = "Passkey Demo";

type CredentialRow = { id: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  // ホストヘッダーからRP IDを動的に取得（ポート番号は除去）
  const rpId = (req.headers.get("host") || "localhost").split(":")[0];
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 登録済みクレデンシャルを取得（再登録を防ぐため excludeCredentials に渡す）
  const existingCredentials = db
    .prepare("SELECT id FROM credentials WHERE user_id = ?")
    .all(session.userId) as CredentialRow[];

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userID: isoUint8Array.fromUTF8String(session.userId),
    userName: session.email,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  // チャレンジをDBに保存（upsert）
  db.prepare(
    "INSERT INTO challenges (user_id, challenge, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET challenge = excluded.challenge, created_at = excluded.created_at",
  ).run(session.userId, options.challenge, new Date().toISOString());

  return NextResponse.json(options);
}
