/**
 * 音声処理APIの型定義
 */

export interface ColorState {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  c?: number; // 0-100
  m?: number; // 0-100
  y?: number; // 0-100
  k?: number; // 0-100
  h?: number; // 0-360
  s?: number; // 0-100
  l?: number; // 0-100
  hsvS?: number; // 0-100
  v?: number; // 0-100
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceProcessRequest {
  transcript: string;
  current_color: ColorState;
  conversation_history: ConversationMessage[];
  language: string; // 'ja' | 'en'
}

export interface Command {
  action: 'SELECT_COLOR' | 'ADJUST_VALUE' | 'CHANGE_SHAPE' | 'TOGGLE_LABEL' | 'SET_COLOR';
  parameters: Record<string, unknown>;
}

export interface VoiceProcessResponse {
  type: 'command' | 'chatbot';
  command: Command | null;
  response: string | null;
  updated_history: ConversationMessage[];
}
