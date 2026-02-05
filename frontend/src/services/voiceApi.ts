/**
 * 音声処理API呼び出しユーティリティ
 */
import { API_ENDPOINTS } from '@/constants/api';
import type { VoiceProcessRequest, VoiceProcessResponse } from '@/types/voice';

/**
 * 音声認識結果をAPIに送信してコマンドまたはチャットボット応答を取得
 */
export async function processVoiceInput(
  request: VoiceProcessRequest
): Promise<VoiceProcessResponse> {
  const response = await fetch(API_ENDPOINTS.VOICE_PROCESS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to process voice input';

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // If parsing fails, use the raw text or default message
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
