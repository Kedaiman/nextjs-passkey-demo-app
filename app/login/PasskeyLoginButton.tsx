"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

async function isPasskeyAvailable(): Promise<boolean> {
  if (window.PublicKeyCredential) {
    // NOTE: クロスデバイス認証は利用可能なため、PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()をチェックしない
    return true;
  }
  return false;
}

export default function PasskeyLoginButton() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    isPasskeyAvailable().then(setAvailable);
  }, []);

  async function handlePasskeyLogin() {
    // 認証オプションをサーバから取得
    const optionsRes = await fetch("/api/passkey/authenticate/options", {
      method: "POST",
    });
    if (!optionsRes.ok) {
      alert("認証オプションの取得に失敗しました");
      return;
    }
    const options = await optionsRes.json();

    // パスキー認証を実行
    let credential;
    try {
      credential = await startAuthentication({ optionsJSON: options });
    } catch (e) {
      alert("認証がキャンセルされたか、エラーが発生しました");
      return;
    }

    // 認証結果をサーバに送信
    const verifyRes = await fetch("/api/passkey/authenticate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    });

    if (verifyRes.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("認証に失敗しました");
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
