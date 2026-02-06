/**
 * チャットボット会話履歴管理hook
 */
import { useState, useCallback } from 'react';
import type { ConversationMessage } from '@/types/voice';

/**
 * useChatbot hook
 * 会話履歴を管理（React stateのみ、ページリロードで消える）
 */
export function useChatbot() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * 会話履歴にメッセージを追加
   */
  const addMessage = useCallback((message: ConversationMessage) => {
    setConversationHistory((prev) => [...prev, message]);
  }, []);

  /**
   * 会話履歴を更新（APIレスポンスから）
   */
  const updateHistory = useCallback((history: ConversationMessage[]) => {
    setConversationHistory(history);
  }, []);

  /**
   * 会話履歴をクリア
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
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
    isModalOpen,
    addMessage,
    updateHistory,
    clearHistory,
    openModal,
    closeModal,
  };
}
