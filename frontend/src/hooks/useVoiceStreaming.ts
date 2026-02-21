import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Command } from '@/types/voice';
import type { ColorState as UiColorState } from '@/types/colorState';

type WsInboundText =
  | {
      type: 'ready';
      inputSampleRateHz: number;
      outputSampleRateHz: number;
    }
  | {
      type: 'transcript';
      text: string;
      final: boolean;
      language?: string;
      segmentId?: string | null;
    }
  | {
      type: 'assistant_text';
      text: string;
      source?: 'output_audio_transcription' | 'output_transcription' | 'text_part' | null;
      segmentId?: string | null;
      final?: boolean | null;
    }
  | {
      type: 'command';
      command: Command;
      tool_name?: string;
      tool_call_id?: string;
    }
  | {
      type: 'error';
      message: string;
      code?: string;
    };

export interface UseVoiceStreamingOptions {
  currentColorState?: UiColorState | null;
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
    onFinalTranscript,
    onTranscriptUpdate,
    onAssistantMessage,
    onCommand,
    onError,
  } = options;

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const wsTokenRef = useRef<string | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const isFirstTimeRef = useRef<boolean>(true); // ページロードごとにリセットされる

  // playback scheduling
  const playTimeRef = useRef<number>(0);

  // Keep latest color state in a ref so we can access it from stable WS callbacks.
  const currentColorRef = useRef<UiColorState | null>(null);
  useEffect(() => {
    currentColorRef.current = currentColorState ?? null;
  }, [currentColorState]);

  const lastSentColorJsonRef = useRef<string | null>(null);
  const colorDebounceTimerRef = useRef<number | null>(null);

  const buildWireColorState = useCallback((cs: UiColorState) => {
    // Keep schema aligned with backend voice ColorState (r/g/b required; others optional).
    return {
      r: cs.r,
      g: cs.g,
      b: cs.b,
      c: cs.c,
      m: cs.m,
      y: cs.y,
      k: cs.k,
      h: cs.h,
      s: cs.s,
      l: cs.l,
      hsvS: cs.hsvS,
      v: cs.v,
    };
  }, []);

  const sendColorState = useCallback(
    (cs: UiColorState) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const payload = { type: 'color_state', color: buildWireColorState(cs) };
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // ignore best-effort
      }
    },
    [buildWireColorState]
  );

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      // keep AudioContext for playback; close only if you want a hard reset
    }

    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch {
        // ignore
      }
      silentGainRef.current = null;
    }
  }, []);

  const cleanupWs = useCallback((opts?: { code?: number; reason?: string }) => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        if (opts?.code != null) {
          ws.close(opts.code, opts.reason);
        } else {
          ws.close();
        }
      } catch {
        // ignore
      }
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

  const getEnvBase = useCallback((): string | undefined => {
    const env = import.meta.env as unknown as Record<string, string | undefined>;
    return env.VITE_WS_BASE_URL;
  }, []);

  const getWsUrl = useCallback(() => {
    // Same-origin by default (CloudFront配下で動かす想定)
    const envBase = getEnvBase();
    if (envBase) {
      // allow ws(s)://host[:port] or http(s)://host[:port]
      if (envBase.startsWith('ws://') || envBase.startsWith('wss://')) {
        return `${envBase}/ws/live`;
      }
      if (envBase.startsWith('http://')) {
        return `ws://${envBase.slice('http://'.length)}/ws/live`;
      }
      if (envBase.startsWith('https://')) {
        return `wss://${envBase.slice('https://'.length)}/ws/live`;
      }
      return `${envBase.replace(/\/+$/, '')}/ws/live`;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/live`;
  }, [getEnvBase]);

  const getHttpBase = useCallback(() => {
    const envBase = getEnvBase();
    if (envBase) {
      // token は http(s) で叩く必要があるのでws(s)を変換する
      if (envBase.startsWith('ws://')) return `http://${envBase.slice('ws://'.length)}`;
      if (envBase.startsWith('wss://')) return `https://${envBase.slice('wss://'.length)}`;
      if (envBase.startsWith('http://') || envBase.startsWith('https://')) {
        return envBase.replace(/\/+$/, '');
      }
      return envBase.replace(/\/+$/, '');
    }
    return `${window.location.protocol}//${window.location.host}`;
  }, [getEnvBase]);

  const ensureWsTokenCookie = useCallback(async () => {
    // WSと同じオリジンにcookieをmintする（ローカル開発でもCloudFront/ECSに向けられるようにする）
    const url = `${getHttpBase()}/api/ws/token?return_token=1`;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // CloudFront->origin が瞬間的に 504/タイムアウトすることがあるので、短いリトライで吸収する
    const maxAttempts = 4;
    const timeoutMs = 7000;

    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!res.ok) {
          // 504など: 次のattemptへ
          lastErr = new Error(`ws token fetch failed (status=${res.status})`);
        } else {
          // 3rd-party cookieがブロックされてもWSが張れるように、トークンも保持しておく
          try {
            const json = (await res.json()) as { token?: string };
            wsTokenRef.current = json?.token || null;
          } catch {
            wsTokenRef.current = null;
          }
          return;
        }
      } catch (e) {
        lastErr = e;
      } finally {
        window.clearTimeout(timer);
      }

      // 最後のattemptは即throw
      if (attempt < maxAttempts) {
        // 小さめのバックオフ + ジッタ
        const backoff = 250 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150);
        await sleep(backoff);
      }
    }

    const msg =
      lastErr instanceof Error
        ? lastErr.message
        : typeof lastErr === 'string'
          ? lastErr
          : 'Failed to obtain WebSocket token';
    throw new Error(msg);
  }, [getHttpBase]);

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  };

  const downsample = (buffer: Float32Array, inputRate: number, outputRate: number) => {
    if (outputRate === inputRate) return buffer;
    const ratio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      // simple average to reduce aliasing a bit
      let acc = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        acc += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? acc / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

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

    const now = ctx.currentTime;
    if (playTimeRef.current < now) {
      // small jitter buffer
      playTimeRef.current = now + 0.05;
    }
    src.start(playTimeRef.current);
    playTimeRef.current += buf.duration;
  }, []);

  const stop = useCallback(async () => {
    shouldReconnectRef.current = false;
    reconnectAttemptRef.current = 0;
    clearReconnectTimer();

    setIsStreaming(false);
    setIsConnecting(false);
    setIsConnected(false);

    try {
      wsRef.current?.send(JSON.stringify({ type: 'stop' }));
    } catch {
      // ignore
    }

    if (colorDebounceTimerRef.current != null) {
      window.clearTimeout(colorDebounceTimerRef.current);
      colorDebounceTimerRef.current = null;
    }

    cleanupAudio();
    // Close with a normal-close code so the browser doesn't surface a pseudo "1005".
    cleanupWs({ code: 1000, reason: 'client stop' });
  }, [cleanupAudio, cleanupWs, clearReconnectTimer]);

  // Debounced "current color" sync while WS is connected.
  useEffect(() => {
    if (!isConnected) return;
    if (!currentColorState) return;

    const json = JSON.stringify(buildWireColorState(currentColorState));
    if (lastSentColorJsonRef.current === json) return;

    if (colorDebounceTimerRef.current != null) {
      window.clearTimeout(colorDebounceTimerRef.current);
      colorDebounceTimerRef.current = null;
    }

    // Small debounce to avoid spamming while sliders are dragged.
    colorDebounceTimerRef.current = window.setTimeout(() => {
      sendColorState(currentColorState);
      lastSentColorJsonRef.current = json;
      colorDebounceTimerRef.current = null;
    }, 150);

    return () => {
      if (colorDebounceTimerRef.current != null) {
        window.clearTimeout(colorDebounceTimerRef.current);
        colorDebounceTimerRef.current = null;
      }
    };
  }, [buildWireColorState, currentColorState, isConnected, sendColorState]);

  const start = useCallback(async () => {
    if (isConnecting || isStreaming) return;

    shouldReconnectRef.current = true;
    setError(null);
    setTranscript('');
    setIsConnecting(true);

    try {
      await ensureWsTokenCookie();
      const baseWsUrl = getWsUrl();
      const token = wsTokenRef.current;
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
        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        // 初回フラグをチェック（useRefを使用、ページロードごとにリセット）
        const isFirstTime = isFirstTimeRef.current;

        ws.send(
          JSON.stringify({
            type: 'start',
            language: i18n.language === 'ja' ? 'ja' : 'en',
            isFirstTime: isFirstTime,
          })
        );

        // 初回の場合はフラグを設定（次回以降は初回でないことを示す）
        if (isFirstTime) {
          isFirstTimeRef.current = false;
        }

        // Best-effort: immediately sync current color state after start.
        if (currentColorRef.current) {
          sendColorState(currentColorRef.current);
          try {
            lastSentColorJsonRef.current = JSON.stringify(
              buildWireColorState(currentColorRef.current)
            );
          } catch {
            lastSentColorJsonRef.current = null;
          }
        }

        // mic start after WS open
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        micStreamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const ws2 = wsRef.current;
          if (!ws2 || ws2.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const down = downsample(input, ctx.sampleRate, 16000);
          const pcm16 = floatTo16BitPCM(down);
          ws2.send(pcm16.buffer);
        };

        source.connect(processor);
        processor.connect(silentGain); // some browsers require it connected

        setIsStreaming(true);
        setIsConnecting(false);
      };

      ws.onmessage = (evt) => {
        if (typeof evt.data === 'string') {
          let msg: WsInboundText | null = null;
          try {
            msg = JSON.parse(evt.data) as WsInboundText;
          } catch {
            return;
          }
          if (!msg) return;

          if (msg.type === 'transcript') {
            setTranscript(msg.text);
            if (onTranscriptUpdate) {
              onTranscriptUpdate(msg.text, {
                final: msg.final,
                segmentId: msg.segmentId,
                language: msg.language ?? null,
              });
            }
            if (msg.final && onFinalTranscript) onFinalTranscript(msg.text);
          } else if (msg.type === 'assistant_text') {
            // Prefer "audio-consistent" assistant text (output_audio_transcription) for chat history display.
            if (msg.text && onAssistantMessage) {
              onAssistantMessage(msg.text, {
                source: msg.source,
                segmentId: msg.segmentId,
                final: msg.final,
              });
            }
          } else if (msg.type === 'command') {
            if (onCommand) onCommand(msg.command);
          } else if (msg.type === 'error') {
            // エラーコード1008の場合は翻訳メッセージに置き換え
            if (
              msg.code === '1008' ||
              msg.message?.includes('1008') ||
              msg.message?.includes('Operation is not implemented')
            ) {
              setErr(t('errors.serviceBusy'));
            } else {
              setErr(msg.message);
            }
          }
          // ready/assistant_text はUI側で必要なら後で拡張
        } else if (evt.data instanceof ArrayBuffer) {
          // server -> binary: PCM S16LE 24kHz
          schedulePcmPlayback(evt.data, 24000);
        }
      };

      ws.onerror = (evt) => {
        // ブラウザのWSエラーは情報が少ないので、URLだけでもログに残す
        // eslint-disable-next-line no-console
        console.warn('[useVoiceStreaming] WebSocket error', {
          url: getWsUrl(),
          event: evt,
        });
        setErr('WebSocket error');
      };

      ws.onclose = (evt) => {
        // eslint-disable-next-line no-console
        console.warn('[useVoiceStreaming] WebSocket closed', {
          url: getWsUrl(),
          code: evt.code,
          reason: evt.reason,
          wasClean: evt.wasClean,
        });

        setIsConnected(false);
        setIsStreaming(false);
        setIsConnecting(false);
        cleanupAudio();

        if (colorDebounceTimerRef.current != null) {
          window.clearTimeout(colorDebounceTimerRef.current);
          colorDebounceTimerRef.current = null;
        }

        // stop() などの「意図的な切断」はエラー表示しない。
        // close event の 1005 は「close code なし」を表す擬似コードで、正常系でも出やすい。
        const isExpectedClose =
          !shouldReconnectRef.current || evt.code === 1000 || evt.code === 1005;
        if (!isExpectedClose) {
          // エラーコード1008の場合は翻訳メッセージに置き換え
          if (
            evt.code === 1008 ||
            evt.reason?.includes('1008') ||
            evt.reason?.includes('Operation is not implemented')
          ) {
            setErr(t('errors.serviceBusy'));
          } else {
            setErr(`WebSocket closed (code=${evt.code}) ${evt.reason || ''}`.trim());
          }
        }

        if (shouldReconnectRef.current) {
          // exponential backoff with jitter (max 10s)
          reconnectAttemptRef.current += 1;
          const base = Math.min(1000 * 2 ** (reconnectAttemptRef.current - 1), 10000);
          const jitter = Math.floor(Math.random() * 250);
          const delay = base + jitter;
          clearReconnectTimer();
          reconnectTimerRef.current = window.setTimeout(() => {
            // avoid throwing if component unmounted / user stopped
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
    cleanupAudio,
    clearReconnectTimer,
    ensureWsTokenCookie,
    getWsUrl,
    i18n.language,
    isConnecting,
    isStreaming,
    onCommand,
    onAssistantMessage,
    onFinalTranscript,
    onTranscriptUpdate,
    schedulePcmPlayback,
    sendColorState,
    setErr,
    stop,
    t,
  ]);

  // onclose内でstart()を直接参照するとlintが厳しいためref経由で呼ぶ
  useEffect(() => {
    startRef.current = () => {
      void start();
    };
    return () => {
      startRef.current = null;
    };
  }, [start]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isConnecting,
    isConnected,
    isStreaming,
    error,
    transcript,
    start,
    stop,
  };
}
