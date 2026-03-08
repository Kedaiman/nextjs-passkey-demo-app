import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CredentialRow = { id: string };

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await req.json()) as { id: string };
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // 他ユーザのクレデンシャルを削除できないよう、user_id も条件に含める
  const credential = db
    .prepare("SELECT id FROM credentials WHERE id = ? AND user_id = ?")
    .get(id, session.userId) as CredentialRow | undefined;

  if (!credential) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM credentials WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
