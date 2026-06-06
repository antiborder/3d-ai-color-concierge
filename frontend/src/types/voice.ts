/**
 * 音声処理APIの型定義
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Command {
  action: 'SELECT_COLOR' | 'ADJUST_VALUE' | 'CHANGE_SHAPE' | 'SET_COLOR' | 'COPY_HEX' | 'SET_HEX' | 'SET_HARMONY' | 'SET_COLOR_SETS';
  parameters: Record<string, unknown>;
}
