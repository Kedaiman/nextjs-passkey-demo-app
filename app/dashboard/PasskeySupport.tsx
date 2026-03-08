"use client";

import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable,
  startRegistration,
} from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import PasskeyCapabilities, { type Capabilities } from "./PasskeyCapabilities";

export default function PasskeySupport() {
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !browserSupportsWebAuthn()) {
      Promise.resolve().then(() =>
        setCaps({
          webAuthn: false,
          platformAuthenticator: false,
          autofill: false,
          automaticUpgrade: false,
        }),
      );
      return;
    }

    Promise.all([
      platformAuthenticatorIsAvailable(),
      browserSupportsWebAuthnAutofill(),
    ]).then(([platform, autofill]) => {
      setCaps({
        webAuthn: true,
        platformAuthenticator: platform,
        autofill,
        automaticUpgrade: autofill,
      });
    });
  }, []);

  async function handleCreatePasskey() {
    const optionsRes = await fetch("/api/passkey/register/options", {
      method: "POST",
    });
    if (!optionsRes.ok) {
      alert("オプションの取得に失敗しました");
      return;
    }
    const options = await optionsRes.json();

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
    } catch (e) {
      if (e instanceof Error && e.name === "InvalidStateError") {
        alert("このデバイスのパスキーはすでに登録されています");
      } else {
        alert("パスキーの作成に失敗しました");
      }
      return;
    }

    const verifyRes = await fetch("/api/passkey/register/verify", {
      method: "POST",
      body: JSON.stringify(credential),
    });
    if (verifyRes.ok) {
      window.location.reload();
    } else {
      alert("パスキーの登録に失敗しました");
      return;
    }
  }

  const available = caps?.platformAuthenticator ?? null;

  return (
    <div>
      <div className="mt-6 rounded-xl border p-4">
        {available === null ? (
          <p className="text-sm text-gray-400">パスキー対応状況を確認中...</p>
        ) : available ? (
          <>
            <p className="text-sm font-medium text-green-700">
              このデバイスはパスキーに対応しています
            </p>
            <p className="mt-1 text-xs text-green-600">
              パスキーを登録して、より安全にログインできます。
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-red-700">
              このデバイスはパスキーに対応していません
            </p>
            <p className="mt-1 text-xs text-red-600">
              パスキーを利用するには、対応ブラウザ・デバイスが必要です。
            </p>
          </>
        )}
      </div>

      <PasskeyCapabilities caps={caps} />

      {caps?.platformAuthenticator && (
        <button
          onClick={handleCreatePasskey}
          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          パスキーを作成
        </button>
      )}
    </div>
  );
}
