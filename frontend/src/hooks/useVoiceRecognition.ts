import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface UseVoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
}

/**
 * Custom hook for Web Speech API voice recognition
 * Supports Japanese (ja-JP) and English (en-US)
 */
export const useVoiceRecognition = (options: UseVoiceRecognitionOptions) => {
  const { i18n } = useTranslation();
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    error: null,
    transcript: '',
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { onResult, onError, continuous = false, interimResults = false } = options;

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          error: 'Speech recognition is not supported in this browser',
        }));
      }, 0);
      return;
    }

    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setState((prev) => ({ ...prev, isSupported: true }));
    }, 0);

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    // Set language based on current i18n language
    const languageMap: Record<string, string> = {
      ja: 'ja-JP',
      en: 'en-US',
    };
    recognition.lang = languageMap[i18n.language] || 'en-US';

    // Event handlers
    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: '',
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setState((prev) => ({
        ...prev,
        transcript: fullTranscript.trim(),
      }));

      // Call onResult with final transcript
      if (finalTranscript && onResult) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred during speech recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or access denied';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          break;
        case 'network':
          errorMessage = 'Network error occurred';
          break;
        case 'aborted':
          // User stopped recognition, not an error
          setState((prev) => ({ ...prev, isListening: false }));
          return;
        default:
          errorMessage = `Recognition error: ${event.error}`;
      }

      setState((prev) => ({
        ...prev,
        isListening: false,
        error: errorMessage,
      }));

      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    // Update language when i18n language changes
    const updateLanguage = () => {
      if (recognitionRef.current) {
        const languageMap: Record<string, string> = {
          ja: 'ja-JP',
          en: 'en-US',
        };
        recognitionRef.current.lang = languageMap[i18n.language] || 'en-US';
      }
    };

    i18n.on('languageChanged', updateLanguage);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping
        }
      }
      i18n.off('languageChanged', updateLanguage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition is not supported',
      }));
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      // Recognition might already be running
      // Ignore errors when starting
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
  };
};
