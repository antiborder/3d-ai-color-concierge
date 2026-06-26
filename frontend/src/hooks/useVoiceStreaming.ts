import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Command, WsInboundText } from '@/types/voice';
import type { ColorState as UiColorState } from '@/types/colorState';
import type { ColorHistoryItem } from '@/hooks/useColorHistory';
import { floatTo16BitPCM, downsample } from '../utils/audioUtils';
import { getWsUrl, fetchWsToken } from '../utils/wsEndpoint';
import { usePcmPlayer } from './usePcmPlayer';
import { useWsColorSync } from './useWsColorSync';

export interface UseVoiceStreamingOptions {
  currentColorState?: UiColorState | null;
  bridgeColorA?: { r: number; g: number; b: number } | null;
  bridgeColorB?: { r: number; g: number; b: number } | null;
  colorHistory?: ColorHistoryItem[];
  onFinalTranscript?: (text: string) => void;
  onTranscriptUpdate?: (
    text: string,
    meta?: { final?: boolean | null; segmentId?: string | null; language?: string | null }
  ) => void;
  onAssistantMessage?: (
    text: string,
    meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
  ) => void;
  onCommand?: (command: Command) => void;
  onError?: (message: string) => void;
}

export function useVoiceStreaming(options: UseVoiceStreamingOptions = {}) {
  const { i18n, t } = useTranslation();
  const {
    currentColorState,
    bridgeColorA,
    bridgeColorB,
    colorHistory,
    onFinalTranscript,
    onTranscriptUpdate,
    onAssistantMessage,
    onCommand,
    onError,
  } = options;

  // ─── Refs ───────────────────────────────────────────────────────────────────

  const wsRef = useRef<WebSocket | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const isFirstTimeRef = useRef<boolean>(true);

  // VAD thresholds
  const vadThresholdRef = useRef<number>(0.1);
  const userVoiceRecognitionThresholdRef = useRef<number>(0.0001);

  // パフォーマンス測定用タイムスタンプ
  const perfTimestampsRef = useRef<{
    startCalled?: number;
    wsOpen?: number;
    getUserMediaStart?: number;
    getUserMediaEnd?: number;
    firstAudioSent?: number;
    lastAudioSent?: number;
    lastResponseReceived?: number;
    lastTranscriptReceived?: number;
    lastAssistantTextReceived?: number;
    lastCommandReceived?: number;
  }>({});

  // ─── State ──────────────────────────────────────────────────────────────────

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  // ─── Audio playback (usePcmPlayer) ──────────────────────────────────────────

  const {
    audioCtxRef,
    isAISpeaking,
    isAISpeakingRef,
    stopAIAudio,
    schedulePcmPlayback,
    calculateRMS,
  } = usePcmPlayer();

  // ─── Color sync (useWsColorSync) ─────────────────────────────────────────────

  const {
    buildWireColorState,
    sendColorState,
    cancelPendingSync,
    currentColorRef,
    lastSentColorJsonRef,
  } = useWsColorSync({
    wsRef,
    isConnected,
    currentColorState,
    bridgeColorA,
    bridgeColorB,
    colorHistory,
  });

  // ─── Mic / session cleanup ───────────────────────────────────────────────────

  const cleanupAudio = useCallback(() => {
    stopAIAudio();

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (silentGainRef.current) {
      try { silentGainRef.current.disconnect(); } catch { /* ignore */ }
      silentGainRef.current = null;
    }
  }, [stopAIAudio]);

  // ─── WebSocket lifecycle ─────────────────────────────────────────────────────

  const cleanupWs = useCallback((opts?: { code?: number; reason?: string }) => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        if (opts?.code != null) ws.close(opts.code, opts.reason);
        else ws.close();
      } catch { /* ignore */ }
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const setErr = useCallback(
    (message: string) => {
      setError(message);
      if (onError) onError(message);
    },
    [onError]
  );

  // ─── Session: message routing ────────────────────────────────────────────────

  const handleWsMessage = useCallback((evt: MessageEvent) => {
    const now = performance.now();
    const ts = perfTimestampsRef.current;

    if (typeof evt.data === 'string') {
      let msg: WsInboundText | null = null;
      try {
        msg = JSON.parse(evt.data) as WsInboundText;
      } catch {
        return;
      }
      if (!msg) return;

      if (msg.type === 'transcript') {
        if (!ts.lastTranscriptReceived) {
          const elapsed = ts.lastAudioSent ? now - ts.lastAudioSent : 0;
          console.log(`[PERF] first_transcript_received elapsed=${elapsed.toFixed(1)}ms text_len=${msg.text.length}`);
        }
        ts.lastTranscriptReceived = now;
        setTranscript(msg.text);
        if (onTranscriptUpdate) {
          onTranscriptUpdate(msg.text, { final: msg.final, segmentId: msg.segmentId, language: msg.language ?? null });
        }
        if (msg.final && onFinalTranscript) onFinalTranscript(msg.text);

      } else if (msg.type === 'assistant_text') {
        if (!ts.lastAssistantTextReceived) {
          const elapsed = ts.lastAudioSent ? now - ts.lastAudioSent : 0;
          console.log(`[PERF] first_assistant_text_received elapsed=${elapsed.toFixed(1)}ms text_len=${msg.text.length}`);
        }
        ts.lastAssistantTextReceived = now;
        if (msg.text && onAssistantMessage) {
          onAssistantMessage(msg.text, { source: msg.source, segmentId: msg.segmentId, final: msg.final });
        }

      } else if (msg.type === 'command') {
        if (!ts.lastCommandReceived) {
          const elapsed = ts.lastAudioSent ? now - ts.lastAudioSent : 0;
          console.log(`[PERF] first_command_received elapsed=${elapsed.toFixed(1)}ms action=${msg.command?.action || 'unknown'}`);
        }
        ts.lastCommandReceived = now;
        if (onCommand) onCommand(msg.command);

      } else if (msg.type === 'error') {
        if (msg.code === '1008' || msg.message?.includes('1008') || msg.message?.includes('Operation is not implemented')) {
          setErr(t('errors.serviceBusy'));
        } else {
          setErr(msg.message);
        }
      }

    } else if (evt.data instanceof ArrayBuffer) {
      if (!ts.lastResponseReceived) {
        const elapsed = ts.lastAudioSent ? now - ts.lastAudioSent : 0;
        console.log(`[PERF] first_audio_chunk_received elapsed=${elapsed.toFixed(1)}ms bytes=${evt.data.byteLength}`);
      }
      ts.lastResponseReceived = now;
      schedulePcmPlayback(evt.data, 24000);
    }
  }, [onTranscriptUpdate, onFinalTranscript, onAssistantMessage, onCommand, setErr, t, schedulePcmPlayback]);

  // ─── Session: start / stop ───────────────────────────────────────────────────

  const stop = useCallback(async () => {
    shouldReconnectRef.current = false;
    reconnectAttemptRef.current = 0;
    clearReconnectTimer();

    setIsStreaming(false);
    setIsConnecting(false);
    setIsConnected(false);

    try { wsRef.current?.send(JSON.stringify({ type: 'stop' })); } catch { /* ignore */ }

    cancelPendingSync();
    cleanupAudio();
    cleanupWs({ code: 1000, reason: 'client stop' });
  }, [cancelPendingSync, cleanupAudio, cleanupWs, clearReconnectTimer]);

  const start = useCallback(async (opts?: { skipIntro?: boolean }) => {
    if (isConnecting || isStreaming) return;

    const startTime = performance.now();
    const ts = perfTimestampsRef.current;
    ts.startCalled = startTime;
    console.log('[PERF] start() called');

    shouldReconnectRef.current = true;
    setError(null);
    setTranscript('');
    setIsConnecting(true);

    try {
      const token = await fetchWsToken();
      const baseWsUrl = getWsUrl();
      const wsUrl = token ? `${baseWsUrl}?ws_token=${encodeURIComponent(token)}` : baseWsUrl;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      await ctx.resume();
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(ctx.destination);
      silentGainRef.current = silentGain;

      ws.onopen = async () => {
        const wsOpenTime = performance.now();
        ts.wsOpen = wsOpenTime;
        console.log(`[PERF] ws.onopen elapsed=${(wsOpenTime - startTime).toFixed(1)}ms`);

        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        const isFirstTime = isFirstTimeRef.current;
        ws.send(JSON.stringify({
          type: 'start',
          language: i18n.language === 'ja' ? 'ja' : 'en',
          isFirstTime: opts?.skipIntro ? false : isFirstTime,
        }));
        if (isFirstTime) isFirstTimeRef.current = false;

        if (currentColorRef.current) {
          sendColorState(currentColorRef.current);
          try {
            lastSentColorJsonRef.current = JSON.stringify(buildWireColorState(currentColorRef.current));
          } catch {
            lastSentColorJsonRef.current = null;
          }
        }

        // mic setup
        const getUserMediaStart = performance.now();
        ts.getUserMediaStart = getUserMediaStart;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        const getUserMediaEnd = performance.now();
        ts.getUserMediaEnd = getUserMediaEnd;
        console.log(
          `[PERF] getUserMedia elapsed=${(getUserMediaEnd - getUserMediaStart).toFixed(1)}ms` +
          ` total=${(getUserMediaEnd - startTime).toFixed(1)}ms`
        );
        micStreamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const ws2 = wsRef.current;
          if (!ws2 || ws2.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const rms = calculateRMS(input);

          if (isAISpeakingRef.current && rms > vadThresholdRef.current) {
            stopAIAudio();
            try { ws2.send(JSON.stringify({ type: 'interrupt' })); } catch { /* best-effort */ }
          }

          if (rms > userVoiceRecognitionThresholdRef.current) {
            const pcm16 = floatTo16BitPCM(downsample(input, ctx.sampleRate, 16000));
            const now = performance.now();
            const ts2 = perfTimestampsRef.current;
            if (!ts2.firstAudioSent) {
              ts2.firstAudioSent = now;
              console.log(`[PERF] first_audio_sent elapsed=${(now - startTime).toFixed(1)}ms bytes=${pcm16.buffer.byteLength}`);
            }
            if (ts2.lastAudioSent && now - ts2.lastAudioSent > 100) {
              console.log(`[PERF] audio_sent elapsed=${(now - ts2.lastAudioSent).toFixed(1)}ms bytes=${pcm16.buffer.byteLength}`);
            }
            ts2.lastAudioSent = now;
            ws2.send(pcm16.buffer);
          }
        };

        source.connect(processor);
        processor.connect(silentGain);

        setIsStreaming(true);
        setIsConnecting(false);
      };

      ws.onmessage = handleWsMessage;

      ws.onerror = (evt) => {
        console.warn('[useVoiceStreaming] WebSocket error', { url: getWsUrl(), event: evt });
        setErr('WebSocket error');
      };

      ws.onclose = (evt) => {
        console.warn('[useVoiceStreaming] WebSocket closed', {
          url: getWsUrl(), code: evt.code, reason: evt.reason, wasClean: evt.wasClean,
        });

        setIsConnected(false);
        setIsStreaming(false);
        setIsConnecting(false);
        cleanupAudio();
        cancelPendingSync();

        const isExpectedClose = !shouldReconnectRef.current || evt.code === 1000 || evt.code === 1005;
        if (!isExpectedClose) {
          if (evt.code === 1008 || evt.reason?.includes('1008') || evt.reason?.includes('Operation is not implemented')) {
            setErr(t('errors.serviceBusy'));
          } else {
            setErr(`WebSocket closed (code=${evt.code}) ${evt.reason || ''}`.trim());
          }
        }

        if (shouldReconnectRef.current) {
          reconnectAttemptRef.current += 1;
          const base = Math.min(1000 * 2 ** (reconnectAttemptRef.current - 1), 10000);
          const delay = base + Math.floor(Math.random() * 250);
          clearReconnectTimer();
          reconnectTimerRef.current = window.setTimeout(() => {
            if (shouldReconnectRef.current) startRef.current?.();
          }, delay);
        }
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start voice streaming';
      setErr(message);
      await stop();
    }
  }, [
    buildWireColorState,
    calculateRMS,
    cancelPendingSync,
    cleanupAudio,
    clearReconnectTimer,
    handleWsMessage,
    i18n.language,
    isAISpeakingRef,
    isConnecting,
    isStreaming,
    sendColorState,
    setErr,
    stop,
    stopAIAudio,
    t,
    audioCtxRef,
  ]);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // onclose 内で start() を直接参照するとlintが厳しいためref経由で呼ぶ
  useEffect(() => {
    startRef.current = () => { void start(); };
    return () => { startRef.current = null; };
  }, [start]);

  // cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  // ─── Public API ──────────────────────────────────────────────────────────────

  const sendTextMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: 'text_message', text }));
    } catch { /* best-effort */ }
  }, []);

  return {
    isConnecting,
    isConnected,
    isStreaming,
    isAISpeaking,
    error,
    transcript,
    start,
    stop,
    sendTextMessage,
  };
}
