import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CredentialRow = {
  id: string;
  synced: number;
  registered: number;
  last_used: number | null;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = db
    .prepare(
      "SELECT id, synced, registered, last_used FROM credentials WHERE user_id = ? ORDER BY registered DESC",
    )
    .all(session.userId) as CredentialRow[];

  return NextResponse.json(credentials);
}
