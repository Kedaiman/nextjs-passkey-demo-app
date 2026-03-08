import db from "@/lib/db";
import { getSession } from "@/lib/session";
import PasskeyDeleteButton from "./PasskeyDeleteButton";

type PasskeyRow = {
  id: string;
  synced: number;
  registered: number;
  last_used: number | null;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PasskeyList() {
  const session = await getSession();
  const passkeys = db
    .prepare(
      "SELECT id, synced, registered, last_used FROM credentials WHERE user_id = ? ORDER BY registered DESC",
    )
    .all(session!.userId) as PasskeyRow[];

  if (passkeys.length === 0) {
    return (
      <p className="mt-2 text-xs text-gray-400">
        登録済みのパスキーはありません
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-2">
      {passkeys.map((pk) => {
        const synced = pk.synced === 1;
        return (
          <li
            key={pk.id}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">
                {synced ? "マルチデバイスパスキー" : "シングルデバイスパスキー"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  synced
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {synced ? "同期あり" : "同期なし"}
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs text-gray-500">
                登録日時：{formatDate(pk.registered)}
              </p>
              <p className="text-xs text-gray-500">
                最終利用：{pk.last_used ? formatDate(pk.last_used) : "未使用"}
              </p>
            </div>
            <PasskeyDeleteButton id={pk.id} />
          </li>
        );
      })}
    </ul>
  );
}
