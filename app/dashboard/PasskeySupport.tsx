"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

type SupportStatus = "checking" | "supported" | "unsupported";

const getInitialStatus = (): SupportStatus => {
  // ブラウザがパスキーをサポートしているか確認
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return "unsupported";
  }

  return "checking";
};

export default function PasskeySupport() {
  // const [ステートの値, ステートを更新する関数] = useState<ステートの型>(初期値);
  const [status, setStatus] = useState<SupportStatus>(getInitialStatus);
  const [conditionalMediationAvailable, setConditionalMediationAvailable] =
    useState<boolean | null>(null);

  /*
  副作用フック（コンポーネントの更新時に自動的に処理を実行させるためのもの）
  useEffect(関数, ステートを配列で指定(このステートが更新されたときに関数を実行する));
  ※第二引数の配列を空にすると、コンポーネントの初回レンダリング後に一度だけ関数が実行される
  */
  useEffect(() => {
    // ブラウザがパスキーをサポートしているか確認
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return;
    }

    let isCancelled = false;

    Promise.all([
      // ユーザの利用しているデバイスがパスキーをサポートしているかを確認
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      // フォームオートフィルログイン（Conditional UI）が利用可能かを確認
      PublicKeyCredential.isConditionalMediationAvailable(),
    ])
      .then(([available, conditionalAvailable]) => {
        if (!isCancelled) {
          setStatus(available ? "supported" : "unsupported");
          setConditionalMediationAvailable(conditionalAvailable);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setStatus("unsupported");
          setConditionalMediationAvailable(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // パスキー対応状況に応じたUIを表示
  if (status === "checking") {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-400">パスキー対応状況を確認中...</p>
      </div>
    );
  }

  async function handleCreatePasskey() {
    // API経由でパスキー作成オプション（challenge含む)を取得
    const optionsRes = await fetch("/api/passkey/register/options", {
      method: "POST",
    });
    if (!optionsRes.ok) {
      alert("オプションの取得に失敗しました");
      return;
    }
    const options = await optionsRes.json();
    let credentil;
    try {
      credentil = await startRegistration({ optionsJSON: options });
    } catch (e) {
      if (e instanceof Error && e.name === "InvalidStateError") {
        alert("このデバイスのパスキーはすでに登録されています");
      } else {
        alert("パスキーの作成に失敗しました");
      }
      return;
    }

    // パスキー作成レスポンスの検証と保存
    const verifyRes = await fetch("/api/passkey/register/verify", {
      method: "POST",
      body: JSON.stringify(credentil),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      alert(`パスキーの登録に失敗しました"}`);
      return;
    }
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
        <p className="mt-2 text-xs text-green-600">
          フォームオートフィルログイン（Conditional UI）:{" "}
          {conditionalMediationAvailable === null
            ? "確認中..."
            : conditionalMediationAvailable
              ? "利用可能"
              : "利用不可"}
        </p>
        <button
          onClick={handleCreatePasskey}
          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          パスキーを作成
        </button>
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
