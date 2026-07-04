/**
 * 音声処理APIの型定義
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Command {
  action:
    | 'SELECT_COLOR'
    | 'ADJUST_VALUE'
    | 'CHANGE_SHAPE'
    | 'SET_COLOR'
    | 'COPY_HEX'
    | 'SET_HEX'
    | 'SET_HARMONY'
    | 'SET_COLOR_SETS'
    | 'SET_BRIDGE_COLOR'
    | 'SELECT_BRIDGE_POSITION'
    | 'SHOW_CONTENT'
    | 'DISMISS_CONTENT'
    | 'SHOW_COLOR_LABELS';
  parameters: Record<string, unknown>;
}

export type WsInboundText =
  | { type: 'ready'; inputSampleRateHz: number; outputSampleRateHz: number }
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
  | { type: 'command'; command: Command; tool_name?: string; tool_call_id?: string }
  | { type: 'interrupted' }
  | { type: 'error'; message: string; code?: string };
