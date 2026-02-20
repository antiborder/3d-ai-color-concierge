import './App.css';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import ControlPane from './components/ColorPicker/ControlPane';
import Structure from './components/ColorPicker/Structure';
import Header from './components/common/Header';
import VoiceControl from './components/VoiceControl/VoiceControl';
import ChatHistoryModal from './components/Chatbot/ChatHistoryModal';
import { useColorState } from './hooks/useColorState';
import { executeCommand, useVoiceCommand } from './hooks/useVoiceCommand';
import type { Command as VoiceCommand } from './types/voice';
import { useChatbot } from './hooks/useChatbot';

function App() {
  const { i18n } = useTranslation();

  // URLのクエリパラメータ（?lang=jaなど）を監視して言語を更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'ja' || langParam === 'en')) {
      if (i18n.language !== langParam) {
        i18n.changeLanguage(langParam);
      }
    }
  }, [i18n]);

  // ブラウザの戻る/進むボタンでURLが変更されたときも言語を更新
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      if (langParam && (langParam === 'ja' || langParam === 'en')) {
        if (i18n.language !== langParam) {
          i18n.changeLanguage(langParam);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [i18n]);
  const {
    colorState,
    updateFromRgb,
    updateFromHsv,
    updateFromHex,
    updateRgbValue,
    updateCmykValue,
    updateHslValue,
    updateHsvValue,
    setShape,
    setRgbMainElement,
    setCmykMainElement,
    setHslMainElement,
    setHsvMainElement,
    toggleLabel,
    setHexInput,
    adjustHslValue,
  } = useColorState();

  // Handler functions for color changes
  const handleRgbChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'R' | 'G' | 'B'
  ) => {
    updateRgbValue(colorParam, Number(event.target.value));
  };

  const handleCmykChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'C' | 'M' | 'Y' | 'K'
  ) => {
    updateCmykValue(colorParam, Number(event.target.value));
  };

  const handleHslChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'H' | 'S' | 'L'
  ) => {
    updateHslValue(colorParam, Number(event.target.value));
  };

  const handleHsvChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'H' | 'HsvS' | 'V'
  ) => {
    updateHsvValue(colorParam, Number(event.target.value));
  };

  const handleClick = (r: number, g: number, b: number) => {
    updateFromRgb(r, g, b);
  };

  const handleHsvElementClick = (h: number, s: number, v: number) => {
    updateFromHsv(h, s, v);
  };

  const handleHexUpdate = () => {
    updateFromHex(colorState.hexInput);
  };

  // Chatbot hook for conversation history management
  const {
    conversationHistory,
    displayHistory,
    isModalOpen,
    addMessage,
    updateHistory,
    clearHistory,
    openModal,
    closeModal,
  } = useChatbot();

  // Voice command handlers
  const voiceCommandHandlers = {
    updateFromRgb,
    updateRgbValue,
    setShape,
    toggleLabel,
    adjustHslValue,
  };

  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);

  // Color group filter states
  const [cssColorsEnabled, setCssColorsEnabled] = useState(true);
  const [materialColorsEnabled, setMaterialColorsEnabled] = useState(true);
  const [japaneseColorsEnabled, setJapaneseColorsEnabled] = useState(false);

  // Use voice command hook with conversation history
  const { processCommand } = useVoiceCommand(
    colorState,
    voiceCommandHandlers,
    conversationHistory,
    updateHistory
  );

  // When a WS tool-call command arrives, we apply it directly and skip the REST
  // processing for the next short window to avoid double-applying.
  const skipRestUntilRef = useRef<number>(0);
  const wsCommandProcessedRef = useRef<boolean>(false);

  const handleWsCommand = (command: VoiceCommand) => {
    // WebSocket経由でコマンドが処理されたことを記録
    wsCommandProcessedRef.current = true;
    // より長い時間（5秒）スキップする
    skipRestUntilRef.current = Date.now() + 5000;
    executeCommand(command, voiceCommandHandlers);
  };

  // Handle voice recognition transcript
  const handleVoiceTranscript = async (transcript: string) => {
    // Always show the user's utterance in the visible chat history immediately.
    if (transcript && transcript.trim()) {
      addMessage({ role: 'user', content: transcript.trim() });
    }

    // WebSocket経由でコマンドが処理された場合は、HTTP APIを完全にスキップ
    if (Date.now() < skipRestUntilRef.current || wsCommandProcessedRef.current) {
      // フラグをリセット（次のトランスクリプトのために）
      wsCommandProcessedRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      await processCommand(transcript);
    } catch (error) {
      // HTTP APIのネットワークエラーは無視（WebSocketで処理されているため）
      // fetchが失敗した場合、TypeErrorがスローされる
      if (error instanceof TypeError) {
        // ネットワークエラーの場合は警告のみ（useVoiceCommandで既に処理済み）
        console.warn('HTTP API unavailable (likely using WebSocket instead):', error.message);
      } else {
        // その他のエラーは再スロー（useVoiceCommandで処理される）
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssistantMessage = (
    text: string,
    meta?: { source?: string | null; segmentId?: string | null; final?: boolean | null }
  ) => {
    // We only want "chat-like" assistant messages that correspond to the OUTPUT audio.
    // If backend provides a source, prefer server-generated output audio transcripts.
    // NOTE: backend may emit either of these depending on SDK/API version:
    // - output_audio_transcription
    // - output_transcription
    if (
      meta?.source &&
      meta.source !== 'output_audio_transcription' &&
      meta.source !== 'output_transcription'
    ) {
      return;
    }

    // WebSocket経由でアシスタントメッセージが来た場合もフラグを設定
    // これにより、HTTP API経由の処理をスキップして重複を防ぐ
    if (meta?.source === 'output_audio_transcription' || meta?.source === 'output_transcription') {
      wsCommandProcessedRef.current = true;
      skipRestUntilRef.current = Date.now() + 5000;
    }

    addMessage({
      role: 'assistant',
      content: text,
      meta: {
        source: meta?.source,
        segmentId: meta?.segmentId,
        final: meta?.final,
      },
    });
  };

  const handleTranscriptUpdate = (
    text: string,
    meta?: { final?: boolean | null; segmentId?: string | null; language?: string | null }
  ) => {
    // Show user's voice transcription in chat history as a streaming/updatable bubble.
    if (!text || !text.trim()) return;
    addMessage({
      role: 'user',
      content: text.trim(),
      meta: {
        source: 'input_transcription',
        segmentId: meta?.segmentId ?? null,
        final: meta?.final ?? null,
      },
    });
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice recognition error:', error);
    setIsLoading(false);
    // Error is already handled by useVoiceCommand with toast notification
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header
        cssColorsEnabled={cssColorsEnabled}
        materialColorsEnabled={materialColorsEnabled}
        japaneseColorsEnabled={japaneseColorsEnabled}
        onCssColorsToggle={setCssColorsEnabled}
        onMaterialColorsToggle={setMaterialColorsEnabled}
        onJapaneseColorsToggle={setJapaneseColorsEnabled}
      />
      <Structure
        shape={colorState.shape}
        isLabelShown={colorState.isLabelShown}
        onParticleClick={handleClick}
        focusR={colorState.r}
        focusG={colorState.g}
        focusB={colorState.b}
        focusC={colorState.c}
        focusM={colorState.m}
        focusY={colorState.y}
        focusK={colorState.k}
        focusH={colorState.h}
        focusS={colorState.s}
        focusL={colorState.l}
        focusHsvS={colorState.hsvS}
        focusV={colorState.v}
        rgbMainElement={colorState.rgbMainElement}
        cmykMainElement={colorState.cmykMainElement}
        hslMainElement={colorState.hslMainElement}
        hsvMainElement={colorState.hsvMainElement}
        cssColorsEnabled={cssColorsEnabled}
        materialColorsEnabled={materialColorsEnabled}
        japaneseColorsEnabled={japaneseColorsEnabled}
      />
      <ControlPane
        handleLabel={toggleLabel}
        handleClick={handleClick}
        handleHsvElementClick={handleHsvElementClick}
        onShapeClick={setShape}
        onRgbChange={handleRgbChange}
        onCmykChange={handleCmykChange}
        onHslChange={handleHslChange}
        onHsvChange={handleHsvChange}
        setRgbMainElement={setRgbMainElement}
        setCmykMainElement={setCmykMainElement}
        setHslMainElement={setHslMainElement}
        setHsvMainElement={setHsvMainElement}
        shape={colorState.shape}
        focusR={colorState.r}
        focusG={colorState.g}
        focusB={colorState.b}
        focusC={colorState.c}
        focusM={colorState.m}
        focusY={colorState.y}
        focusK={colorState.k}
        focusH={colorState.h}
        focusS={colorState.s}
        focusL={colorState.l}
        focusHsvS={colorState.hsvS}
        focusV={colorState.v}
        rgbMainElement={colorState.rgbMainElement}
        hslMainElement={colorState.hslMainElement}
        hsvMainElement={colorState.hsvMainElement}
        cmykMainElement={colorState.cmykMainElement}
        setFocusR={(value: number) => updateRgbValue('R', value)}
        setFocusG={(value: number) => updateRgbValue('G', value)}
        setFocusB={(value: number) => updateRgbValue('B', value)}
        hexInput={colorState.hexInput}
        setHexInput={setHexInput}
        onHexUpdate={handleHexUpdate}
      />
      <VoiceControl
        currentColorState={colorState}
        onTranscript={handleVoiceTranscript}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAssistantMessage={handleAssistantMessage}
        onCommand={handleWsCommand}
        onError={handleVoiceError}
        onOpenChatHistory={openModal}
        isLoading={isLoading}
      />
      <ChatHistoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        conversationHistory={displayHistory}
        onClearHistory={clearHistory}
      />
    </>
  );
}

export default App;
