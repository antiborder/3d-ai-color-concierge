import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { ColorState as UiColorState } from '@/types/colorState';
import type { ColorHistoryItem } from '@/hooks/useColorHistory';

interface UseWsColorSyncParams {
  wsRef: MutableRefObject<WebSocket | null>;
  isConnected: boolean;
  currentColorState: UiColorState | null | undefined;
  bridgeColorA: { r: number; g: number; b: number } | null | undefined;
  bridgeColorB: { r: number; g: number; b: number } | null | undefined;
  colorHistory: ColorHistoryItem[] | undefined;
}

export function useWsColorSync({
  wsRef,
  isConnected,
  currentColorState,
  bridgeColorA,
  bridgeColorB,
  colorHistory,
}: UseWsColorSyncParams) {
  const bridgeColorARef = useRef(bridgeColorA);
  bridgeColorARef.current = bridgeColorA;
  const bridgeColorBRef = useRef(bridgeColorB);
  bridgeColorBRef.current = bridgeColorB;
  const colorHistoryRef = useRef(colorHistory);
  colorHistoryRef.current = colorHistory;

  const currentColorRef = useRef<UiColorState | null>(null);
  const lastSentColorJsonRef = useRef<string | null>(null);
  const colorDebounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    currentColorRef.current = currentColorState ?? null;
  }, [currentColorState]);

  const buildWireColorState = useCallback((cs: UiColorState) => ({
    r: cs.r, g: cs.g, b: cs.b,
    c: cs.c, m: cs.m, y: cs.y, k: cs.k,
    h: cs.h, s: cs.s, l: cs.l,
    hsbS: cs.hsbS, v: cs.v,
  }), []);

  const sendColorState = useCallback(
    (cs: UiColorState) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const color: Record<string, unknown> = { ...buildWireColorState(cs) };
      if (bridgeColorARef.current) color.bridgeColorA = bridgeColorARef.current;
      if (bridgeColorBRef.current) color.bridgeColorB = bridgeColorBRef.current;
      try {
        ws.send(JSON.stringify({ type: 'color_state', color }));
      } catch { /* best-effort */ }
    },
    [wsRef, buildWireColorState]
  );

  const cancelPendingSync = useCallback(() => {
    if (colorDebounceTimerRef.current != null) {
      window.clearTimeout(colorDebounceTimerRef.current);
      colorDebounceTimerRef.current = null;
    }
  }, []);

  // Debounced color sync while connected
  useEffect(() => {
    if (!isConnected || !currentColorState) return;
    const json = JSON.stringify(buildWireColorState(currentColorState));
    if (lastSentColorJsonRef.current === json) return;
    cancelPendingSync();
    colorDebounceTimerRef.current = window.setTimeout(() => {
      sendColorState(currentColorState);
      lastSentColorJsonRef.current = json;
      colorDebounceTimerRef.current = null;
    }, 150);
    return cancelPendingSync;
  }, [buildWireColorState, cancelPendingSync, currentColorState, isConnected, sendColorState]);

  // Re-send color_state when bridge colors change while connected
  useEffect(() => {
    if (!isConnected) return;
    const cs = currentColorRef.current;
    if (!cs) return;
    sendColorState(cs);
    lastSentColorJsonRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeColorA, bridgeColorB, isConnected]);

  // Sync color history to backend whenever it changes while connected
  useEffect(() => {
    if (!isConnected) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const history = (colorHistoryRef.current ?? []).slice(0, 50).map(({ hex, r, g, b }) => ({
      hex, r: Math.round(r), g: Math.round(g), b: Math.round(b),
    }));
    try {
      ws.send(JSON.stringify({ type: 'color_history', history }));
    } catch { /* best-effort */ }
  }, [colorHistory, isConnected, wsRef]);

  return { buildWireColorState, sendColorState, cancelPendingSync, currentColorRef, lastSentColorJsonRef };
}
