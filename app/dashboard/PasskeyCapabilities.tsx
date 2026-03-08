"use client";

export type Capabilities = {
  webAuthn: boolean; // WebAuthn 基本対応
  platformAuthenticator: boolean; // デバイス内蔵パスキー
  autofill: boolean; // オートフィルログイン (Conditional UI)
  automaticUpgrade: boolean; // Automatic passkey upgrade
};

function Badge({ value }: { value: boolean }) {
  return value ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      利用可能
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
      利用不可
    </span>
  );
}

const ROWS: { label: string; key: keyof Capabilities }[] = [
  { label: "WebAuthn 基本対応", key: "webAuthn" },
  { label: "デバイス内蔵パスキー", key: "platformAuthenticator" },
  { label: "オートフィルログイン (Conditional UI)", key: "autofill" },
  { label: "Automatic passkey upgrade", key: "automaticUpgrade" },
];

export default function PasskeyCapabilities({
  caps,
}: {
  caps: Capabilities | null;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">
        パスキー機能の利用可否
      </h2>
      {caps === null ? (
        <p className="text-xs text-gray-400">確認中...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left font-medium text-gray-500">
                機能
              </th>
              <th className="pb-2 text-right font-medium text-gray-500">
                状態
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, key }) => (
              <tr key={key} className="border-b border-gray-100 last:border-0">
                <td className="py-2 text-gray-700">{label}</td>
                <td className="py-2 text-right">
                  <Badge value={caps[key]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
