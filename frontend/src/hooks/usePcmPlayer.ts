import { useState, useRef, useCallback } from 'react';

export function usePcmPlayer() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const playTimeRef = useRef<number>(0);
  const isAISpeakingRef = useRef<boolean>(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const stopAIAudio = useCallback(() => {
    audioSourceNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    });
    audioSourceNodesRef.current = [];
    playTimeRef.current = 0;
    isAISpeakingRef.current = false;
    setIsAISpeaking(false);
  }, []);

  const schedulePcmPlayback = useCallback((pcmS16le: ArrayBuffer, sampleRateHz: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const i16 = new Int16Array(pcmS16le);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;

    const buf = ctx.createBuffer(1, f32.length, sampleRateHz);
    buf.copyToChannel(f32, 0);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    audioSourceNodesRef.current.push(src);
    isAISpeakingRef.current = true;
    setIsAISpeaking(true);

    src.onended = () => {
      audioSourceNodesRef.current = audioSourceNodesRef.current.filter((n) => n !== src);
      if (audioSourceNodesRef.current.length === 0) {
        isAISpeakingRef.current = false;
        setIsAISpeaking(false);
      }
    };

    const now = ctx.currentTime;
    if (playTimeRef.current < now) playTimeRef.current = now + 0.05;
    src.start(playTimeRef.current);
    playTimeRef.current += buf.duration;
  }, []);

  const calculateRMS = useCallback((audioData: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) sum += audioData[i] * audioData[i];
    return Math.sqrt(sum / audioData.length);
  }, []);

  return {
    audioCtxRef,
    isAISpeaking,
    isAISpeakingRef,
    stopAIAudio,
    schedulePcmPlayback,
    calculateRMS,
  };
}
