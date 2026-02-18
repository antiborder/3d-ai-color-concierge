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

  const [state, setState] = useState<TTSState>(() => ({
    isSpeaking: false,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    queueLength: 0,
  }));

  const queueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // Avoid self-referential callbacks inside SpeechSynthesis event handlers.
  const processQueueRef = useRef<(() => void) | null>(null);

  // 若い女性の音声を選択する関数
  const selectFemaleVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;

    // 言語に応じた女性音声の名前パターン（優先順位順）
    const femaleVoicePatterns: Record<string, string[]> = {
      'ja-JP': [
        'Kyoko', // macOS
        'Otoya', // macOS（一部のバージョン）
        'female', // 一般的なパターン
        'woman', // 一般的なパターン
        '女性', // 日本語パターン
      ],
      'en-US': [
        'Samantha', // macOS
        'Karen', // Windows
        'Zira', // Windows
        'female', // 一般的なパターン
        'woman', // 一般的なパターン
      ],
    };

    const patterns = femaleVoicePatterns[lang] || [];

    // パターンにマッチする音声を優先順位順に探す
    for (const pattern of patterns) {
      const voice = voices.find(
        (v) => v.lang === lang && v.name.toLowerCase().includes(pattern.toLowerCase())
      );
      if (voice) return voice;
    }

    // パターンにマッチしない場合、言語に一致する最初の音声を返す
    return voices.find((v) => v.lang === lang) || null;
  }, []);

  // 音声リストを取得・更新
  const loadVoices = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    voicesRef.current = voices;
  }, []);

  // ブラウザサポートの確認と音声リストの読み込み
  useEffect(() => {
    if (!state.isSupported && onError) {
      onError('Speech synthesis is not supported in this browser');
      return;
    }

    // 音声リストを読み込む
    loadVoices();

    // voiceschangedイベントを監視（音声リストが非同期で読み込まれる場合があるため）
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [onError, loadVoices, state.isSupported]);

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
    const lang = getLanguage();
    utterance.lang = lang;

    // 若い女性の音声を選択
    const femaleVoice = selectFemaleVoice(lang);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    // ピッチを上げて若い声に近づける（1.0がデフォルト、1.15が若い声）
    utterance.pitch = 1.15;
    utterance.rate = 1.0; // デフォルト速度
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
        processQueueRef.current?.();
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
        processQueueRef.current?.();
      }
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getLanguage, selectFemaleVoice, onSpeakingStart, onSpeakingEnd, onError]);

  // Keep a ref to the latest processQueue callback for SpeechSynthesis handlers.
  useEffect(() => {
    processQueueRef.current = processQueue;
    return () => {
      if (processQueueRef.current === processQueue) {
        processQueueRef.current = null;
      }
    };
  }, [processQueue]);

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
