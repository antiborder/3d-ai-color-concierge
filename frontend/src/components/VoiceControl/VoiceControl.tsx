import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useVoiceStreaming } from '../../hooks/useVoiceStreaming';
import { useLiveSubtitle } from '../../hooks/useLiveSubtitle';
import type { Command } from '../../types/voice';
import type { ColorState } from '../../types/colorState';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';
import {
  VoiceControlRoot,
  TranscriptionPanel,
  ErrorPanel,
  StyledVoiceControl,
  VoiceInputContainer,
  ChatButton,
  Spinner,
  WaveBarsContainer,
  WaveBarEl,
  TextInputForm,
  TextInput,
  SubmitButton,
  LoadingMessage,
  type ButtonState,
} from './VoiceControl.styles';

// ChatIcon kept for future use with the commented-out chat history button
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
void ChatIcon; // suppress unused warning

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
  const spinnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingHelpRef = useRef<string | null>(null);
  const lastHelpIdRef = useRef<number>(0);

  const SESSION_LIMIT_MS = 5 * 60 * 1000;

  // Streaming session
  const {
    isStreaming,
    isConnecting,
    isConnected,
    isAISpeaking,
    audioCtxRef,
    playTimeRef,
    error,
    start,
    stop,
    sendTextMessage,
  } = useVoiceStreaming({
    currentColorState,
    bridgeColorA,
    bridgeColorB,
    colorHistory,
    onFinalTranscript: onTranscript,
    onTranscriptUpdate,
    onAssistantMessage: useCallback(
      (
        text: string,
        meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
      ) => {
        handleAssistantChunkRef.current?.(text, meta);
        onAssistantMessage?.(text, meta);
      },
      [onAssistantMessage] // eslint-disable-line react-hooks/exhaustive-deps
    ),
    onCommand,
    onError: useCallback(
      (msg: string) => {
        if (onError) onError(msg);
      },
      [onError]
    ),
  });

  // Live subtitle accumulation
  const { liveSubtitle, handleAssistantChunk, clearSubtitle } = useLiveSubtitle({
    isAISpeaking,
    isConnected,
    audioCtxRef,
    playTimeRef,
  });

  // Stable ref so the onAssistantMessage callback above can call handleAssistantChunk
  // without being in its own deps (avoids circular dep between useVoiceStreaming and useLiveSubtitle)
  const handleAssistantChunkRef = useRef(handleAssistantChunk);
  handleAssistantChunkRef.current = handleAssistantChunk;

  // 5分タイムアウト: isStreaming が true になったら開始、false になったらリセット
  useEffect(() => {
    if (!isStreaming) {
      if (sessionTimeoutRef.current) { clearTimeout(sessionTimeoutRef.current); sessionTimeoutRef.current = null; }
      return;
    }
    sessionTimeoutRef.current = setTimeout(() => {
      stop();
      toast(t('voiceControl.sessionTimeout'), {
        duration: 5000,
        style: { background: '#333', color: '#fff' },
      });
    }, SESSION_LIMIT_MS);
    return () => {
      if (sessionTimeoutRef.current) { clearTimeout(sessionTimeoutRef.current); sessionTimeoutRef.current = null; }
    };
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // スピナーを3秒後に非表示にする
  useEffect(() => {
    if (!showSpinner) return;
    spinnerTimeoutRef.current = setTimeout(() => setShowSpinner(false), 3000);
    return () => {
      if (spinnerTimeoutRef.current) clearTimeout(spinnerTimeoutRef.current);
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
    clearSubtitle();
    if (isConnected) {
      sendTextMessage(helpRequest.text);
    } else {
      pendingHelpRef.current = helpRequest.text;
      if (!isStreaming && !isConnecting) void start({ skipIntro: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpRequest]);

  const handleMicClick = () => {
    if (isStreaming || isConnecting) {
      setShowSpinner(false);
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      stop();
    } else {
      if (isFirstStart) {
        setShowSpinner(true);
        setIsFirstStart(false);
      }
      start();
    }
  };

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onTranscript(textInput.trim());
      setTextInput('');
    }
  };

  const buttonState: ButtonState = (() => {
    if (!isStreaming && !isConnecting) return 'idle';
    if (isAISpeaking) return 'responding';
    if (isConnected) return 'listening';
    return 'connecting';
  })();

  const WAVE_DELAYS = [0, 0.12, 0.24, 0.36, 0.48];

  return (
    <VoiceControlRoot>
      {error ? (
        <ErrorPanel>{error}</ErrorPanel>
      ) : liveSubtitle ? (
        <TranscriptionPanel $textColor={(currentColorState?.l ?? 50) >= 50 ? '#000000' : '#ffffff'}>
          {liveSubtitle}
        </TranscriptionPanel>
      ) : null}
      <StyledVoiceControl $isListening={buttonState !== 'idle'}>
        <VoiceInputContainer>
          <ChatButton onClick={handleMicClick} disabled={isLoading} $state={buttonState}>
            {buttonState === 'idle' && 'Start Chatting ▶︎'}
            {buttonState === 'connecting' && (
              <>
                <Spinner />
                Connecting...
              </>
            )}
            {(buttonState === 'listening' || buttonState === 'responding') && (
              <>
                <WaveBarsContainer>
                  {WAVE_DELAYS.map((delay, i) => (
                    <WaveBarEl key={i} $fast={buttonState === 'listening'} $delay={delay} />
                  ))}
                </WaveBarsContainer>
                {buttonState === 'listening' ? 'Listening...' : 'Responding...'}
              </>
            )}
          </ChatButton>
          <TextInputForm onSubmit={handleTextSubmit} style={{ display: 'none' }}>
            <TextInput
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
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
      </StyledVoiceControl>
    </VoiceControlRoot>
  );
};

export default VoiceControl;
