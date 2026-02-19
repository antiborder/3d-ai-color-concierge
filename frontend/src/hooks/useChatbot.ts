/**
 * チャットボット会話履歴管理hook
 */
import { useMemo, useState, useCallback } from 'react';
import type { ConversationMessage } from '@/types/voice';

export type ChatDisplayMessage = ConversationMessage & {
  // Only used for WS/live display; never sent to REST API.
  meta?: {
    source?: string | null;
    segmentId?: string | null;
    final?: boolean | null;
  };
};

/**
 * useChatbot hook
 * 会話履歴を管理（React stateのみ、ページリロードで消える）
 */
export function useChatbot() {
  // History coming from the REST API (/api/voice/*). Used as model context.
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  // Extra messages coming from the Live WS stream (e.g. output_audio_transcription).
  // Kept separate so REST-driven history updates don't wipe them.
  const [liveExtraHistory, setLiveExtraHistory] = useState<ChatDisplayMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * 会話履歴（Live/WS由来）にメッセージを追加
   */
  const addMessage = useCallback((message: ChatDisplayMessage) => {
    setLiveExtraHistory((prev) => [...prev, message]);
  }, []);

  /**
   * 会話履歴を更新（APIレスポンスから）
   */
  const updateHistory = useCallback((history: ConversationMessage[]) => {
    setConversationHistory(history);
  }, []);

  /**
   * 表示用の会話履歴（API履歴 + WS追加分）
   *
   * 仕様:
   * - WS由来の assistant テキストは「音声とほぼ同じ」表示が目的なので、
   *   直前の assistant メッセージがある場合は置き換える（重複表示を減らす）。
   */
  const displayHistory = useMemo(() => {
    const merged: ChatDisplayMessage[] = [...conversationHistory];
    for (const msg of liveExtraHistory) {
      const last = merged[merged.length - 1];

      // 1) If this is a streaming update, replace only the same segment bubble (user or assistant).
      if (msg.meta?.segmentId) {
        if (last && last.role === msg.role && last.meta?.segmentId === msg.meta.segmentId) {
          merged[merged.length - 1] = msg;
          continue;
        }
      }

      // 2) Avoid adjacent duplicates (e.g. user transcript added immediately + REST history later).
      if (last && last.role === msg.role && last.content === msg.content) {
        continue;
      }

      merged.push(msg);
    }
    return merged;
  }, [conversationHistory, liveExtraHistory]);

  /**
   * 会話履歴をクリア
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLiveExtraHistory([]);
  }, []);

  /**
   * モーダルを開く
   */
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  /**
   * モーダルを閉じる
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    conversationHistory,
    displayHistory,
    isModalOpen,
    addMessage,
    updateHistory,
    clearHistory,
    openModal,
    closeModal,
  };
}
