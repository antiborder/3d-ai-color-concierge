/**
 * 音声コマンド実行エンジン
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { processVoiceInput } from '@/services/voiceApi';
import type { ColorState as VoiceColorState, VoiceProcessRequest, Command } from '@/types/voice';
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
 * @returns processCommand - 音声トランスクリプトを処理してコマンドを実行する関数
 */
export function useVoiceCommand(currentColorState: ColorState, handlers: VoiceCommandHandlers) {
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
        // ステップ5.1では会話履歴は空（ステップ6.1で実装）
        const request: VoiceProcessRequest = {
          transcript,
          current_color: currentColor,
          conversation_history: [],
          language: i18n.language === 'ja' ? 'ja' : 'en',
        };

        // API呼び出し
        const response = await processVoiceInput(request);

        // レスポンスタイプに応じて処理
        if (response.type === 'command' && response.command) {
          executeCommand(response.command, handlers);
        } else if (response.type === 'chatbot' && response.response) {
          // ステップ5.1ではチャットボット応答はログ出力のみ
          // ステップ6.1でUI表示を実装
          console.log('Chatbot response:', response.response);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to process voice command';
        console.error('Voice command error:', error);
        toast.error(errorMessage);
      }
    },
    [currentColorState, handlers, i18n.language]
  );

  return { processCommand };
}

/**
 * コマンドを実行
 */
function executeCommand(command: Command, handlers: VoiceCommandHandlers): void {
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
