"use client";

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
    // NOTE: 本来はサーバから認証オプションを取得するが、一旦固定値で実装
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
      {
        // チャレンジ
        challenge,
        // RPのドメインを指定
        rpId: "localhost",
        // ローカルユーザ検証の設定
        userVerification: "required",
      };

    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
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
