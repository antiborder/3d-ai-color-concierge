import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useTTS } from '../../hooks/useTTS';
import styled, { keyframes } from 'styled-components';

interface VoiceControlProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  onOpenChatHistory?: () => void;
  isLoading?: boolean;
  onSpeak?: (text: string) => void;
}

const VoiceControl = ({
  onTranscript,
  onError,
  onOpenChatHistory,
  isLoading = false,
}: VoiceControlProps) => {
  const { t } = useTranslation();
  const [textInput, setTextInput] = useState('');

  const handleResult = useCallback(
    (transcript: string) => {
      onTranscript(transcript);
    },
    [onTranscript]
  );

  const handleError = useCallback(
    (error: string) => {
      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  const { isListening, isSupported, error, startListening, stopListening } = useVoiceRecognition({
    onResult: handleResult,
    onError: handleError,
    continuous: false,
    interimResults: false,
  });

  // TTS hook - ユーザーが話し始めたら停止
  const {
    isSpeaking,
    stop: stopTTS,
    stopIfSpeaking,
  } = useTTS({
    onError: (error) => {
      console.error('TTS error:', error);
    },
  });

  // ユーザーが話し始めたら音声を停止
  useEffect(() => {
    if (isListening) {
      stopIfSpeaking();
    }
  }, [isListening, stopIfSpeaking]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
    <StyledVoiceControl>
      <VoiceInputContainer>
        <MicButton
          onClick={handleMicClick}
          disabled={!isSupported || isLoading}
          $isListening={isListening}
          title={
            isSupported
              ? isListening
                ? t('voiceControl.stop')
                : t('voiceControl.start')
              : t('voiceControl.notSupported')
          }
        >
          {isListening ? (
            <PulsingMic>
              <MicIcon />
            </PulsingMic>
          ) : (
            <MicIcon />
          )}
        </MicButton>
        <TextInputForm onSubmit={handleTextSubmit}>
          <TextInput
            type="text"
            value={textInput}
            onChange={handleTextChange}
            placeholder={t('voiceControl.textPlaceholder')}
            disabled={isListening || isLoading}
          />
          <SubmitButton type="submit" disabled={!textInput.trim() || isListening || isLoading}>
            {t('voiceControl.submit')}
          </SubmitButton>
        </TextInputForm>
        {onOpenChatHistory && (
          <ChatHistoryButton onClick={onOpenChatHistory} title={t('voiceControl.chatHistory')}>
            <ChatIcon />
          </ChatHistoryButton>
        )}
        {isSpeaking && (
          <StopButton onClick={stopTTS} title={t('voiceControl.stopTTS', 'Stop speaking')}>
            <StopIcon />
          </StopButton>
        )}
      </VoiceInputContainer>
      {isLoading && <LoadingMessage>{t('chatbot.loading')}</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!isSupported && <WarningMessage>{t('voiceControl.notSupported')}</WarningMessage>}
    </StyledVoiceControl>
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

const StyledVoiceControl = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
`;

const VoiceInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MicButton = styled.button<{ $isListening: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: ${(props) => (props.$isListening ? '#ff4444' : '#4e8cee')};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$isListening ? '#cc0000' : '#3d7bd6')};
    transform: scale(1.05);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const PulsingMic = styled.div`
  animation: ${pulse} 1.5s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MicIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

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

const WarningMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #fff3cd;
  color: #856404;
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

const StopButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: #ff4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    background-color: #cc0000;
    transform: scale(1.05);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const StopIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export default VoiceControl;
