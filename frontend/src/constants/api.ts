/**
 * APIエンドポイント設定
 */

// 本番はCloudFront配下で同一オリジン（/api/*）に寄せる。
// ローカル開発などで別オリジンにしたい場合のみ VITE_API_BASE_URL を指定する。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  // WebSocket経由で処理されるため、REST APIエンドポイントは不要
} as const;
