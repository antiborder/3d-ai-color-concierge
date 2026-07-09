import styled, { keyframes } from 'styled-components';

export const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

export const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
`;

export const breatheSubtle = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
`;

export const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const waveAnim = keyframes`
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
`;

export type ButtonState = 'idle' | 'connecting' | 'waiting' | 'listening' | 'thinking' | 'responding' | 'executing';

export const VoiceControlRoot = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const ErrorPanel = styled.div`
  padding: 0 4px 8px;
  font-size: 15px;
  font-weight: 500;
  color: #e53935;
  line-height: 1.6;
  text-align: left;
  max-width: min(480px, 90vw);
`;

export const TranscriptionPanel = styled.div<{ $textColor: string }>`
  background: transparent;
  padding: 0 4px 8px;
  font-size: 15px;
  font-weight: 500;
  color: ${(p) => p.$textColor};
  line-height: 1.6;
  text-align: left;
  width: min(380px, 90vw);
`;

export const StyledVoiceControl = styled.div<{ $isListening: boolean }>`
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: fit-content;
  animation: ${(props) => (!props.$isListening ? breathe : 'none')} 2s ease-in-out infinite;
`;

export const VoiceInputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const ChatButton = styled.button<{ $state: ButtonState }>`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background-color: ${({ $state }) =>
    $state === 'connecting'
      ? '#8fa8c8'
      : $state === 'waiting'
        ? '#00897b'
        : $state === 'listening'
          ? '#ef5350'
          : $state === 'thinking'
            ? '#546e7a'
            : $state === 'responding'
              ? '#7e57c2'
              : $state === 'executing'
                ? '#f57c00'
                : '#4e8cee'};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.4s, transform 0.2s;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
  min-width: 200px;
  max-width: 260px;
  animation: ${({ $state }) => ($state === 'idle' ? breatheSubtle : 'none')} 2s ease-in-out infinite;

  &:hover:not(:disabled) {
    background-color: ${({ $state }) =>
      $state === 'connecting'
        ? '#7d95b5'
        : $state === 'waiting'
          ? '#00695c'
          : $state === 'listening'
            ? '#cc0000'
            : $state === 'thinking'
              ? '#37474f'
              : $state === 'responding'
                ? '#6546a8'
                : $state === 'executing'
                  ? '#e65100'
                  : '#3d7bd6'};
    transform: scale(1.02);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.6;
    animation: none;
  }
`;

export const WaveBarsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  flex-shrink: 0;
`;

export const WaveBarEl = styled.div<{ $fast: boolean; $delay: number }>`
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: white;
  transform-origin: center;
  animation: ${waveAnim} ${({ $fast }) => ($fast ? '0.55s' : '1.1s')} ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

export const ListeningIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const TextInputForm = styled.form`
  display: flex;
  flex: 1;
  gap: 8px;
`;

export const TextInput = styled.input`
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

export const SubmitButton = styled.button`
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

export const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 12px;
`;

export const ChatHistoryButton = styled.button`
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

export const LoadingMessage = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
`;
