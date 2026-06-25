import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceStreaming } from '../../hooks/useVoiceStreaming';
import styled, { keyframes } from 'styled-components';
import type { Command } from '../../types/voice';
import type { ColorState } from '../../types/colorState';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

function toDisplayText(text: string): string {
  if (!text) return '';
  // Take text after the last sentence boundary (period/!/?  followed by whitespace)
  const afterLastBoundary = text.replace(/[\s\S]*[.!?。！？]\s+/, '').trim();
  const display = afterLastBoundary || text.trim();
  // Cap at 10 words
  const words = display.split(/\s+/).filter(Boolean);
  return words.length > 10 ? words.slice(-10).join(' ') : display;
}

interface VoiceControlProps {
  currentColorState?: ColorState | null;
  bridgeColorA?: { r: number; g: number; b: number } | null;
  bridgeColorB?: { r: number; g: number; b: number } | null;
  colorHistory?: ColorHistoryItem[];
  onTranscript: (transcript: string) => void;
  onTranscriptUpdate?: (
    text: string,
    meta?: { final?: boolean | null; segmentId?: string | null; language?: string | null }
  ) => void;
  onAssistantMessage?: (
    text: string,
    meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
  ) => void;
  onCommand?: (command: Command) => void;
  onError?: (error: string) => void;
  // onOpenChatHistory?: () => void;
  isLoading?: boolean;
  onSpeak?: (text: string) => void;
  helpRequest?: { text: string; id: number } | null;
}

const VoiceControl = ({
  currentColorState,
  bridgeColorA,
  bridgeColorB,
  colorHistory,
  onTranscript,
  onTranscriptUpdate,
  onAssistantMessage,
  onCommand,
  onError,
  // onOpenChatHistory,
  isLoading = false,
  helpRequest,
}: VoiceControlProps) => {
  const { t } = useTranslation();
  const [textInput, setTextInput] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [isFirstStart, setIsFirstStart] = useState(true);
  const [liveSubtitle, setLiveSubtitle] = useState('');
  const spinnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subtitleClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subtitleBufRef = useRef('');
  const pendingHelpRef = useRef<string | null>(null);
  const lastHelpIdRef = useRef<number>(0);

  const handleResult = useCallback(
    (transcript: string) => {
      onTranscript(transcript);
    },
    [onTranscript]
  );

  const handleStreamingError = useCallback(
    (message: string) => {
      if (onError) onError(message);
    },
    [onError]
  );

  const handleAssistantMessage = useCallback(
    (text: string, meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }) => {
      if (meta?.source === 'output_audio_transcription' || meta?.source === 'output_transcription') {
        // Accumulate across segments so full sentences stay visible.
        // Within a segment the server sends cumulative text; between segments we append.
        const prev = subtitleBufRef.current;
        let next: string;
        if (!prev) {
          next = text;
        } else if (text.startsWith(prev)) {
          next = text; // same segment growing
        } else if (prev.endsWith(text)) {
          next = prev; // duplicate, ignore
        } else {
          next = prev + ' ' + text; // new segment, append
        }
        subtitleBufRef.current = next;
        setLiveSubtitle(next);
        // Clearing is handled by the isAISpeaking effect — no timer here.
      }
      onAssistantMessage?.(text, meta);
    },
    [onAssistantMessage]
  );

  useEffect(() => {
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
    };
  }, []);

  const { isStreaming, isConnecting, isConnected, isAISpeaking, error, start, stop, sendTextMessage } = useVoiceStreaming({
    currentColorState,
    bridgeColorA,
    bridgeColorB,
    colorHistory,
    onFinalTranscript: handleResult,
    onTranscriptUpdate,
    onAssistantMessage: handleAssistantMessage,
    onCommand,
    onError: handleStreamingError,
  });

  // Clear subtitle 1.5s after audio playback ends; cancel if AI starts speaking again.
  useEffect(() => {
    if (isAISpeaking) {
      if (subtitleClearTimerRef.current) {
        clearTimeout(subtitleClearTimerRef.current);
        subtitleClearTimerRef.current = null;
      }
    } else {
      subtitleClearTimerRef.current = setTimeout(() => {
        setLiveSubtitle('');
        subtitleBufRef.current = '';
      }, 1500);
    }
    return () => {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
    };
  }, [isAISpeaking]);

  useEffect(() => {
    if (!isConnected) {
      if (subtitleClearTimerRef.current) clearTimeout(subtitleClearTimerRef.current);
      setLiveSubtitle('');
      subtitleBufRef.current = '';
    }
  }, [isConnected]);

  // スピナーを3秒後に非表示にする
  useEffect(() => {
    if (showSpinner) {
      // 既存のタイマーをクリア
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
      // 3秒後にスピナーを非表示
      spinnerTimeoutRef.current = setTimeout(() => {
        setShowSpinner(false);
      }, 3000);
    }
    // クリーンアップ
    return () => {
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
    };
  }, [showSpinner]);

  // Send pending help text once WebSocket is connected
  useEffect(() => {
    if (isConnected && pendingHelpRef.current) {
      sendTextMessage(pendingHelpRef.current);
      pendingHelpRef.current = null;
    }
  }, [isConnected, sendTextMessage]);

  // React to new helpRequest
  useEffect(() => {
    if (!helpRequest || helpRequest.id === lastHelpIdRef.current) return;
    lastHelpIdRef.current = helpRequest.id;
    if (isConnected) {
      sendTextMessage(helpRequest.text);
    } else {
      pendingHelpRef.current = helpRequest.text;
      if (!isStreaming && !isConnecting) {
        void start({ skipIntro: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpRequest]);

  const handleMicClick = () => {
    if (isStreaming || isConnecting) {
      // Listening...ボタンをクリックしたらスピナーを非表示にしてタイマーをクリア
      setShowSpinner(false);
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      stop();
    } else {
      // Start Chattingをクリックした時
      if (isFirstStart) {
        // 初回のみスピナーを表示
        setShowSpinner(true);
        setIsFirstStart(false);
      }
      start();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onTranscript(textInput.trim());
      setTextInput('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  return (
    <VoiceControlRoot>
      {liveSubtitle && (
        <TranscriptionPanel $textColor={(currentColorState?.l ?? 50) >= 50 ? '#000000' : '#ffffff'}>
          {toDisplayText(liveSubtitle)}
        </TranscriptionPanel>
      )}
      <StyledVoiceControl>
      <VoiceInputContainer>
        <ChatButton
          onClick={handleMicClick}
          disabled={isLoading}
          $isListening={isStreaming || isConnecting}
        >
          {isStreaming || isConnecting ? (
            showSpinner ? (
              <>
                <Spinner />
              </>
            ) : (
              <>
                <ListeningIndicator />
                Listening...
              </>
            )
          ) : (
            'Start Chatting ▶︎'
          )}
        </ChatButton>
        <TextInputForm onSubmit={handleTextSubmit} style={{ display: 'none' }}>
          <TextInput
            type="text"
            value={textInput}
            onChange={handleTextChange}
            placeholder={t('voiceControl.textPlaceholder')}
            disabled={isStreaming || isLoading}
          />
          <SubmitButton type="submit" disabled={!textInput.trim() || isStreaming || isLoading}>
            {t('voiceControl.submit')}
          </SubmitButton>
        </TextInputForm>
        {/* {onOpenChatHistory && (
          <ChatHistoryButton onClick={onOpenChatHistory} title={t('voiceControl.chatHistory')}>
            <ChatIcon />
          </ChatHistoryButton>
        )} */}
      </VoiceInputContainer>
      {isLoading && <LoadingMessage>{t('chatbot.loading')}</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      </StyledVoiceControl>
    </VoiceControlRoot>
  );
};

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const VoiceControlRoot = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 420px;
`;

const TranscriptionPanel = styled.div<{ $textColor: string }>`
  background: transparent;
  padding: 0 4px 8px;
  font-size: 15px;
  font-weight: 500;
  color: ${(p) => p.$textColor};
  line-height: 1.6;
  text-align: center;
`;

const StyledVoiceControl = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const VoiceInputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const ChatButton = styled.button<{ $isListening: boolean }>`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background-color: ${(props) => (props.$isListening ? '#ff4444' : '#4e8cee')};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
  min-width: 200px;
  max-width: 260px;
  animation: ${(props) => (!props.$isListening ? breathe : 'none')} 2s ease-in-out infinite;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$isListening ? '#cc0000' : '#3d7bd6')};
    transform: scale(1.02);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.6;
    animation: none;
  }
`;

const ListeningIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const TextInputForm = styled.form`
  display: flex;
  flex: 1;
  gap: 8px;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4e8cee;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 16px;
  background-color: #4e8cee;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #3d7bd6;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 12px;
`;

const ChatHistoryButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: #6c757d;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    background-color: #5a6268;
    transform: scale(1.05);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ChatIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LoadingMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
`;

export default VoiceControl;
