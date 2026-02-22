/**
 * 音声処理APIの型定義
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Command {
  action: 'SELECT_COLOR' | 'ADJUST_VALUE' | 'CHANGE_SHAPE' | 'TOGGLE_LABEL' | 'SET_COLOR';
  parameters: Record<string, unknown>;
}
