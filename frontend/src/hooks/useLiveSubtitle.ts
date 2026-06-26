import { useState, useRef, useEffect, useCallback } from 'react';

export function useLiveSubtitle({
  isAISpeaking,
  isConnected,
}: {
  isAISpeaking: boolean;
  isConnected: boolean;
}) {
  const [liveSubtitle, setLiveSubtitle] = useState('');
  const subtitleBufRef = useRef('');
  const subtitleClearTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
    };
  }, []);

  // Clear subtitle 1.5s after AI finishes speaking; cancel if AI starts speaking again.
  useEffect(() => {
    if (isAISpeaking) {
      if (subtitleClearTimerRef.current) {
        clearTimeout(subtitleClearTimerRef.current);
        subtitleClearTimerRef.current = null;
      }
    } else {
      subtitleClearTimerRef.current = setTimeout(() => {
        setLiveSubtitle('');
        subtitleBufRef.current = '';
      }, 1500);
    }
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
    };
  }, [isAISpeaking]);

  useEffect(() => {
    if (!isConnected) {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
      setLiveSubtitle('');
      subtitleBufRef.current = '';
    }
  }, [isConnected]);

  const handleAssistantChunk = useCallback(
    (
      text: string,
      meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
    ) => {
      if (meta?.source !== 'output_audio_transcription' && meta?.source !== 'output_transcription')
        return;

      const prev = subtitleBufRef.current;
      let next: string;
      if (!prev) {
        next = text;
      } else if (text.startsWith(prev)) {
        next = text; // same segment growing
      } else if (prev.endsWith(text)) {
        next = prev; // duplicate, ignore
      } else {
        next = prev + ' ' + text; // new segment, append
      }
      subtitleBufRef.current = next;
      setLiveSubtitle(next);
    },
    []
  );

  return { liveSubtitle, handleAssistantChunk };
}
