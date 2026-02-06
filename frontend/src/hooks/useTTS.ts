/**
 * 音声合成（TTS）hook
 * Web Speech Synthesis APIを使用
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UseTTSOptions {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onError?: (error: string) => void;
}

interface TTSState {
  isSpeaking: boolean;
  isSupported: boolean;
  queueLength: number;
}

/**
 * useTTS hook
 * 音声合成、キューイング、停止機能を提供
 */
export function useTTS(options: UseTTSOptions = {}) {
  const { i18n } = useTranslation();
  const { onSpeakingStart, onSpeakingEnd, onError } = options;

  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isSupported: false,
    queueLength: 0,
  });

  const queueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);

  // ブラウザサポートの確認
  useEffect(() => {
    const isSupported = 'speechSynthesis' in window;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported && onError) {
      onError('Speech synthesis is not supported in this browser');
    }
  }, [onError]);

  // 言語マッピング
  const getLanguage = useCallback((): string => {
    const languageMap: Record<string, string> = {
      ja: 'ja-JP',
      en: 'en-US',
    };
    return languageMap[i18n.language] || 'en-US';
  }, [i18n.language]);

  // キューから次の音声を再生
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const text = queueRef.current.shift()!;

    setState((prev) => ({
      ...prev,
      isSpeaking: true,
      queueLength: queueRef.current.length,
    }));

    if (onSpeakingStart) {
      onSpeakingStart();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguage();
    utterance.rate = 1.0; // デフォルト速度
    utterance.pitch = 1.0; // デフォルトピッチ
    utterance.volume = 1.0; // デフォルト音量

    utterance.onend = () => {
      currentUtteranceRef.current = null;
      isProcessingRef.current = false;

      setState((prev) => ({
        ...prev,
        isSpeaking: queueRef.current.length > 0,
        queueLength: queueRef.current.length,
      }));

      if (onSpeakingEnd && queueRef.current.length === 0) {
        onSpeakingEnd();
      }

      // キューに次の音声があれば再生
      if (queueRef.current.length > 0) {
        processQueue();
      }
    };

    utterance.onerror = (event) => {
      currentUtteranceRef.current = null;
      isProcessingRef.current = false;

      const errorMessage = `Speech synthesis error: ${event.error}`;
      console.error(errorMessage);

      setState((prev) => ({
        ...prev,
        isSpeaking: false,
        queueLength: queueRef.current.length,
      }));

      if (onError) {
        onError(errorMessage);
      }

      // エラーが発生してもキューを続行
      if (queueRef.current.length > 0) {
        processQueue();
      }
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getLanguage, onSpeakingStart, onSpeakingEnd, onError]);

  // 音声をキューに追加して再生
  const speak = useCallback(
    (text: string) => {
      if (!state.isSupported || !text.trim()) {
        return;
      }

      queueRef.current.push(text);
      setState((prev) => ({
        ...prev,
        queueLength: queueRef.current.length,
      }));

      // まだ再生中でなければ、すぐに再生開始
      if (!isProcessingRef.current) {
        processQueue();
      }
    },
    [state.isSupported, processQueue]
  );

  // 音声を停止
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    currentUtteranceRef.current = null;
    isProcessingRef.current = false;
    queueRef.current = [];

    setState((prev) => ({
      ...prev,
      isSpeaking: false,
      queueLength: 0,
    }));
  }, []);

  // 外部から停止をトリガーするための関数（useVoiceRecognitionのisListeningがtrueになった時に呼び出す）
  const stopIfSpeaking = useCallback(() => {
    if (state.isSpeaking) {
      stop();
    }
  }, [state.isSpeaking, stop]);

  return {
    ...state,
    speak,
    stop,
    stopIfSpeaking,
  };
}
