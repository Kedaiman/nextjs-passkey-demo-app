"use client";

import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

async function authenticate(useBrowserAutofill = false): Promise<boolean> {
  // 認証オプションをサーバから取得
  const optionsRes = await fetch("/api/passkey/authenticate/options", {
    method: "POST",
  });
  if (!optionsRes.ok) return false;
  const options = await optionsRes.json();

  // パスキー認証レスポンスを取得
  const credential = await startAuthentication({ optionsJSON: options, useBrowserAutofill });
  // 取得したレスポンスをサーバに送信して検証
  const verifyRes = await fetch("/api/passkey/authenticate/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credential),
  });
  return verifyRes.ok;
}

export default function PasskeyLoginButton() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    Promise.resolve().then(() => setAvailable(true));

    // Conditional UI: ページ読み込み時にバックグラウンドで待機
    (async () => {
      const supported = await browserSupportsWebAuthnAutofill();
      if (!supported) return;
      try {
        const ok = await authenticate(true);
        if (ok) window.location.href = "/dashboard";
      } catch {
        // Conditional UI を使わなかった場合やボタン押下で中断された場合は無視
      }
    })();
  }, []);

  async function handlePasskeyLogin() {
    // ボタン押下時は明示的に認証を開始（Conditional UIのリクエストは自動的に中断される）
    try {
      const success = await authenticate();
      if (success) {
        window.location.href = "/dashboard";
      } else {
        alert("認証に失敗しました");
      }
    } catch {
      alert("認証がキャンセルされたか、エラーが発生しました");
    }
  }

  return (
    <button
      type="button"
      onClick={handlePasskeyLogin}
      disabled={!available}
      className="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
    >
      パスキーでログイン
    </button>
  );
}
