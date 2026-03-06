"use client";

import { useEffect, useState } from "react";

type SupportStatus = "checking" | "supported" | "unsupported";

export default function PasskeySupport() {
  // const [ステートの値, ステートを更新する関数] = useState<ステートの型>(初期値);
  const [status, setStatus] = useState<SupportStatus>("checking");

  /* 
  副作用フック（コンポーネントの更新時に自動的に処理を実行させるためのもの）
  useEffect(関数, ステートを配列で指定(このステートが更新されたときに関数を実行する));
  ※第二引数の配列を空にすると、コンポーネントの初回レンダリング後に一度だけ関数が実行される
  */
  useEffect(() => {
    // ブラウザがパスキーをサポートしているか確認
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setStatus("unsupported");
      return;
    }

    // ユーザの利用しているデバイスがパスキーをサポートしているかを確認
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        setStatus(available ? "supported" : "unsupported");
      })
      .catch(() => {
        setStatus("unsupported");
      });
  }, []);

  // パスキー対応状況に応じたUIを表示
  if (status === "checking") {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-400">パスキー対応状況を確認中...</p>
      </div>
    );
  }

  if (status === "supported") {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-700">
          このデバイスはパスキーに対応しています
        </p>
        <p className="mt-1 text-xs text-green-600">
          パスキーを登録して、より安全にログインできます。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-700">
        このデバイスはパスキーに対応していません
      </p>
      <p className="mt-1 text-xs text-red-600">
        パスキーを利用するには、対応ブラウザ・デバイスが必要です。
      </p>
    </div>
  );
}
