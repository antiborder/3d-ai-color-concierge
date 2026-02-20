/**
 * 音声コマンド実行エンジン
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { processVoiceInput } from '@/services/voiceApi';
import type {
  ColorState as VoiceColorState,
  VoiceProcessRequest,
  Command,
  ConversationMessage,
} from '@/types/voice';
import type { ColorSpace } from '@/types/color';
import type { ColorState } from '@/types/colorState';

/**
 * コマンド実行に必要なハンドラー関数の型定義
 */
export interface VoiceCommandHandlers {
  updateFromRgb: (r: number, g: number, b: number) => void;
  updateRgbValue: (colorParam: 'R' | 'G' | 'B', value: number) => void;
  setShape: (shape: ColorSpace) => void;
  toggleLabel: () => void;
  adjustHslValue: (
    property: 'brightness' | 'saturation' | 'hue',
    direction: 'up' | 'down',
    amount?: number
  ) => void;
}

/**
 * useVoiceCommand hook
 *
 * @param currentColorState - 現在の色状態
 * @param handlers - コマンド実行用のハンドラー関数
 * @param conversationHistory - 会話履歴
 * @param onHistoryUpdate - 会話履歴更新コールバック
 * @param onSpeak - 音声合成コールバック（テキストを音声で読み上げる）
 * @returns processCommand - 音声トランスクリプトを処理してコマンドを実行する関数
 */
export function useVoiceCommand(
  currentColorState: ColorState,
  handlers: VoiceCommandHandlers,
  conversationHistory: ConversationMessage[] = [],
  onHistoryUpdate?: (history: ConversationMessage[]) => void,
  onSpeak?: (text: string) => void
) {
  const { i18n } = useTranslation();

  /**
   * 音声トランスクリプトを処理してコマンドを実行
   */
  const processCommand = useCallback(
    async (transcript: string) => {
      try {
        // 現在の色状態をAPIリクエスト形式に変換
        const currentColor: VoiceColorState = {
          r: currentColorState.r,
          g: currentColorState.g,
          b: currentColorState.b,
          c: currentColorState.c,
          m: currentColorState.m,
          y: currentColorState.y,
          k: currentColorState.k,
          h: currentColorState.h,
          s: currentColorState.s,
          l: currentColorState.l,
          hsvS: currentColorState.hsvS,
          v: currentColorState.v,
        };

        // APIリクエストを作成
        const request: VoiceProcessRequest = {
          transcript,
          current_color: currentColor,
          conversation_history: conversationHistory,
          language: i18n.language === 'ja' ? 'ja' : 'en',
        };

        // API呼び出し
        const response = await processVoiceInput(request);

        // 会話履歴を更新
        if (onHistoryUpdate && response.updated_history) {
          onHistoryUpdate(response.updated_history);
        }

        // レスポンスタイプに応じて処理
        if (response.type === 'command' && response.command) {
          executeCommand(response.command, handlers);
          // コマンド実行時の人間っぽいメッセージを音声合成
          // 会話履歴の最後のメッセージ（アシスタントの応答）を使用
          if (onSpeak && response.updated_history.length > 0) {
            const lastMessage = response.updated_history[response.updated_history.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content) {
              onSpeak(lastMessage.content);
            }
          }
        } else if (response.type === 'chatbot' && response.response) {
          // チャットボット応答を音声合成
          if (onSpeak && response.response) {
            onSpeak(response.response);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to process voice command';
        console.error('Voice command error:', error);
        toast.error(errorMessage);
      }
    },
    [currentColorState, handlers, i18n.language, conversationHistory, onHistoryUpdate, onSpeak]
  );

  return { processCommand };
}

/**
 * RGB値をCMYK値に変換
 */
function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  if (r === 0 && g === 0 && b === 0) {
    return [0, 0, 0, 100];
  }

  const rNorm = r / 255.0;
  const gNorm = g / 255.0;
  const bNorm = b / 255.0;

  const k = 1.0 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1.0) {
    return [0, 0, 0, 100];
  }

  const c = ((1.0 - rNorm - k) / (1.0 - k)) * 100.0;
  const m = ((1.0 - gNorm - k) / (1.0 - k)) * 100.0;
  const y = ((1.0 - bNorm - k) / (1.0 - k)) * 100.0;

  return [c, m, y, k * 100.0];
}

/**
 * RGB値をHSL値に変換
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255.0;
  const gNorm = g / 255.0;
  const bNorm = b / 255.0;

  const maxVal = Math.max(rNorm, gNorm, bNorm);
  const minVal = Math.min(rNorm, gNorm, bNorm);
  const delta = maxVal - minVal;

  // Lightness
  const l = (maxVal + minVal) / 2.0;

  let h = 0.0;
  let s = 0.0;

  if (delta !== 0) {
    // Saturation
    if (l < 0.5) {
      s = delta / (maxVal + minVal);
    } else {
      s = delta / (2.0 - maxVal - minVal);
    }

    // Hue
    if (maxVal === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6.0;
    } else if (maxVal === gNorm) {
      h = (bNorm - rNorm) / delta + 2.0;
    } else {
      h = (rNorm - gNorm) / delta + 4.0;
    }
    h *= 60.0;
    if (h < 0) {
      h += 360.0;
    }
  }

  return [h, s * 100.0, l * 100.0];
}

/**
 * 色の特性に基づいて最適な色空間を決定
 */
function determineOptimalColorSpace(
  r: number,
  g: number,
  b: number,
  adjustProperty?: string
): ColorSpace {
  // ADJUST_VALUEでH、S、Lの調整指示があった場合はHSLへ変形
  if (adjustProperty && ['hue', 'saturation', 'brightness'].includes(adjustProperty)) {
    return 'HSL';
  }

  // HSLに変換してLightnessを確認
  const [h, s, l] = rgbToHsl(r, g, b);

  // 色が白に非常に近い場合（L >= 90）はHSL空間へ変形
  if (l >= 90) {
    return 'HSL';
  }

  // RGBのcubeの頂点に相当する場合、または1つのチャンネルだけで表せる場合
  // 閾値: 他の2つのチャンネルが10以下
  const threshold = 10;
  const channels = [
    { value: r, name: 'R' },
    { value: g, name: 'G' },
    { value: b, name: 'B' },
  ];
  const nonZeroChannels = channels.filter((ch) => ch.value > threshold);

  if (nonZeroChannels.length === 1) {
    // 1つのチャンネルだけで表せる場合
    return 'RGB';
  }

  // RGBのcubeの頂点（(255,0,0), (0,255,0), (0,0,255)など）
  if (
    (r === 255 && g === 0 && b === 0) ||
    (r === 0 && g === 255 && b === 0) ||
    (r === 0 && g === 0 && b === 255)
  ) {
    return 'RGB';
  }

  // CMYKに変換して判定
  const [c, m, y, k] = rgbToCmyk(r, g, b);

  // CMYKでC、M、Yのうち1つだけが非ゼロ（またはK以外が1つだけ非ゼロ）の場合
  // 閾値: 他の成分が5%以下
  const cmykThreshold = 5.0;
  const cmykComponents = [
    { value: c, name: 'C' },
    { value: m, name: 'M' },
    { value: y, name: 'Y' },
  ];
  const nonZeroCmyk = cmykComponents.filter((comp) => comp.value > cmykThreshold);

  if (nonZeroCmyk.length === 1 && k < cmykThreshold) {
    // C、M、Yのうち1つだけで表せる場合
    return 'CMYK';
  }

  // 特定のパターン: (0,255,255) -> Cyan, (255,0,255) -> Magenta, (255,255,0) -> Yellow
  if (
    (r === 0 && g === 255 && b === 255) ||
    (r === 255 && g === 0 && b === 255) ||
    (r === 255 && g === 255 && b === 0)
  ) {
    return 'CMYK';
  }

  // それ以外の場合はHSVに変形
  return 'HSV';
}

/**
 * コマンドを実行
 */
export function executeCommand(command: Command, handlers: VoiceCommandHandlers): void {
  switch (command.action) {
    case 'SELECT_COLOR': {
      const color = command.parameters.color as { r: number; g: number; b: number };
      if (
        color &&
        typeof color.r === 'number' &&
        typeof color.g === 'number' &&
        typeof color.b === 'number'
      ) {
        handlers.updateFromRgb(color.r, color.g, color.b);
        
        // 最適な色空間を自動決定して変更
        const optimalColorSpace = 
          (command.parameters.optimalColorSpace as ColorSpace) ||
          determineOptimalColorSpace(color.r, color.g, color.b);
        handlers.setShape(optimalColorSpace);
      }
      break;
    }

    case 'SET_COLOR': {
      // R, G, Bのいずれかを設定
      if ('r' in command.parameters && typeof command.parameters.r === 'number') {
        handlers.updateRgbValue('R', command.parameters.r);
      } else if ('g' in command.parameters && typeof command.parameters.g === 'number') {
        handlers.updateRgbValue('G', command.parameters.g);
      } else if ('b' in command.parameters && typeof command.parameters.b === 'number') {
        handlers.updateRgbValue('B', command.parameters.b);
      }
      break;
    }

    case 'CHANGE_SHAPE': {
      const colorSpace = command.parameters.colorSpace as string;
      if (colorSpace && ['RGB', 'CMYK', 'HSL', 'HSV'].includes(colorSpace.toUpperCase())) {
        handlers.setShape(colorSpace.toUpperCase() as ColorSpace);
      }
      break;
    }

    case 'TOGGLE_LABEL': {
      handlers.toggleLabel();
      break;
    }

    case 'ADJUST_VALUE': {
      const property = command.parameters.property as string;
      const direction = command.parameters.direction as string;
      const amount = command.parameters.amount as number | undefined;
      const optimalColorSpace = command.parameters.optimalColorSpace as ColorSpace | undefined;

      // Validate property
      if (!property || !['brightness', 'saturation', 'hue'].includes(property)) {
        toast.error(`Invalid property: ${property}. Must be 'brightness', 'saturation', or 'hue'`);
        return;
      }

      // Validate direction
      if (!direction || !['up', 'down'].includes(direction)) {
        toast.error(`Invalid direction: ${direction}. Must be 'up' or 'down'`);
        return;
      }

      // Validate amount if provided
      if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
        toast.error(`Invalid amount: ${amount}. Must be a non-negative number`);
        return;
      }

      // H、S、Lの調整指示があった場合はHSL空間へ変形
      if (optimalColorSpace === 'HSL' || ['hue', 'saturation', 'brightness'].includes(property)) {
        handlers.setShape('HSL');
      }

      try {
        handlers.adjustHslValue(
          property as 'brightness' | 'saturation' | 'hue',
          direction as 'up' | 'down',
          amount
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to adjust color value';
        console.error('Adjust value error:', error);
        toast.error(errorMessage);
      }
      break;
    }

    default:
      console.warn('Unknown command action:', command.action);
  }
}
