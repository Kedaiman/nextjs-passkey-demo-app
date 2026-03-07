import db from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  RegistrationResponseJSON,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChallengeData = { challenge: string };

/* 
NextRequest は Request を拡張した型で、nextUrl などのNext.js専用機能が欲しい場合に使用。
※nextUrl や cookies ヘルパーなど
*/
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 期待値の設定
  const expectedOrigin = req.nextUrl.origin;
  const expectedRPID = (req.headers.get("host") || "localhost").split(":")[0];
  const requestCredential = (await req.json()) as RegistrationResponseJSON;
  const challengeData = db
    .prepare("SELECT challenge FROM challenges WHERE user_id = ?")
    .get(session.userId) as ChallengeData | undefined;
  if (!challengeData || !challengeData.challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }
  const expectedChallenge = challengeData.challenge;

  // 登録レスポンスの検証
  try {
    const verification = await verifyRegistrationResponse({
      response: requestCredential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      // ユーザ存在テスト結果の検証
      requireUserPresence: true,
      requireUserVerification: true, // options の userVerification: "required" と対応
    });
    const { verified, registrationInfo } = verification;
    if (!verified) {
      throw new Error("User verification failed");
    }
    const { credential, aaguid, credentialDeviceType } = registrationInfo;
    const base64PublicKey = isoBase64URL.fromBuffer(credential.publicKey);

    // 同期パスキーであるかの判定
    const synced = credentialDeviceType === "multiDevice";

    // DBにパスキー情報を保存
    const cred = {
      // クレデンシャルID
      id: credential.id,
      // 公開鍵
      publicKey: base64PublicKey,
      // パスキープロバイダなどの認証器のモデルを示す一意なID
      aaguid,
      // 同期パスキーかどうか
      synced,
      // 登録日時（タイムスタンプ）
      registered: new Date().getTime(),
      last_used: null,
      // ユーザ識別子であるユーザID
      user_id: session.userId,
    };
    // excludeCredentials で重複は弾かれているため INSERT のみ（重複時はエラー）
    db.prepare(
      "INSERT INTO credentials (id, public_key, aaguid, synced, registered, last_used, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      cred.id,
      cred.publicKey,
      cred.aaguid,
      cred.synced ? 1 : 0,
      cred.registered,
      cred.last_used,
      cred.user_id,
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 },
    );
  } finally {
    try {
      // 成功・失敗に関わらずチャレンジを削除（リプレイ攻撃防止）
      db.prepare("DELETE FROM challenges WHERE user_id = ?").run(
        session.userId,
      );
    } catch (e) {
      console.error("Failed to delete challenge:", e);
    }
  }
}
