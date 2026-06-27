import { useState, useRef, useEffect, useCallback } from 'react';

// 文末記号（全角・半角）
const SENTENCE_END_RE = /[.?!。？！]/;

export function useLiveSubtitle({
  isAISpeaking,
  isConnected,
  audioCtxRef,
  playTimeRef,
}: {
  isAISpeaking: boolean;
  isConnected: boolean;
  audioCtxRef: React.RefObject<AudioContext | null>;
  playTimeRef: React.RefObject<number>;
}) {
  const [liveSubtitle, setLiveSubtitle] = useState('');

  // rawBuf: Geminiから届く累積テキスト全体（マッチング用）
  const rawBufRef = useRef('');
  // displayOffset: rawBuf のうち次に表示を始める位置
  const displayOffsetRef = useRef(0);
  const subtitleClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDelayTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const resetState = useCallback(() => {
    rawBufRef.current = '';
    displayOffsetRef.current = 0;
    pendingDelayTimersRef.current.forEach(clearTimeout);
    pendingDelayTimersRef.current.clear();
    setLiveSubtitle('');
  }, []);

  useEffect(() => {
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
      pendingDelayTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // AI発話終了の 1.5s 後に字幕をクリア
  useEffect(() => {
    if (isAISpeaking) {
      if (subtitleClearTimerRef.current) {
        clearTimeout(subtitleClearTimerRef.current);
        subtitleClearTimerRef.current = null;
      }
    } else {
      subtitleClearTimerRef.current = setTimeout(() => {
        resetState();
      }, 1500);
    }
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
    };
  }, [isAISpeaking, resetState]);

  useEffect(() => {
    if (!isConnected) {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
      resetState();
    }
  }, [isConnected, resetState]);

  const handleAssistantChunk = useCallback(
    (
      text: string,
      meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
    ) => {
      if (meta?.source !== 'output_audio_transcription' && meta?.source !== 'output_transcription')
        return;

      const prev = rawBufRef.current;
      let next: string;

      if (!prev) {
        next = text;
        displayOffsetRef.current = 0;
      } else if (text.startsWith(prev)) {
        next = text; // 同セグメント成長中
      } else if (prev.endsWith(text)) {
        return; // 重複、無視
      } else {
        next = prev + ' ' + text; // 新セグメント追加
      }
      rawBufRef.current = next;

      // displayOffset 以降の表示対象スライスを取得
      const displaySlice = next.slice(displayOffsetRef.current);

      // 文末記号を探して、その位置までを今回の表示テキストとする
      const termIdx = displaySlice.search(SENTENCE_END_RE);
      let displayText: string;
      if (termIdx !== -1) {
        displayText = displaySlice.slice(0, termIdx + 1);
        // 次回はこの文末記号の後（空白も読み飛ばす）から表示開始
        const afterTerm = displaySlice.slice(termIdx + 1).match(/^\s*/);
        displayOffsetRef.current +=
          termIdx + 1 + (afterTerm ? afterTerm[0].length : 0);
      } else {
        displayText = displaySlice;
      }

      // 連続スペースを正規化（英語で単語間スペースが欠落するケースを防ぐ）
      displayText = displayText.replace(/\s+/g, ' ').trim();

      if (!displayText) return;

      // 音声キューの深さ分だけ字幕表示を遅らせる
      const ctx = audioCtxRef.current;
      const delayMs = ctx ? Math.max(0, (playTimeRef.current - ctx.currentTime) * 1000) : 0;
      if (delayMs > 16) {
        const t = setTimeout(() => {
          pendingDelayTimersRef.current.delete(t);
          setLiveSubtitle(displayText);
        }, delayMs);
        pendingDelayTimersRef.current.add(t);
      } else {
        setLiveSubtitle(displayText);
      }
    },
    [audioCtxRef, playTimeRef]
  );

  return { liveSubtitle, handleAssistantChunk };
}
