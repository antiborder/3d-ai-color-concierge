import './App.css';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import ControlPane from './components/ColorPicker/ControlPane';
import Structure from './components/ColorPicker/Structure';
import Header from './components/common/Header';
import MobileControlColumn from './components/common/MobileControlColumn';
import { useMatchMedia } from './hooks/useMatchMedia';
import VoiceControl from './components/VoiceControl/VoiceControl';
import ChatHistoryModal from './components/Chatbot/ChatHistoryModal';
import { useColorState } from './hooks/useColorState';
import { useColorHistory } from './hooks/useColorHistory';
import { useDisplaySettings } from './hooks/useDisplaySettings';
import { useBridgeState } from './hooks/useBridgeState';
import { useHelpRequest } from './hooks/useHelpRequest';
import { executeCommand } from './utils/commandExecutor';
import type { Command as VoiceCommand } from './types/voice';
import { useChatbot } from './hooks/useChatbot';
import { type HarmonyMode, computeHarmonyColors } from './utils/colorHarmony';
import { interpolateRgb } from './components/menus/controls/ColorBridge';

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
    updateFromHsb,
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

  // Color history hook
  const { history, addColor } = useColorHistory();
  const prevColorRef = useRef<{ r: number; g: number; b: number } | null>(null);

  // Add color to history when colorState changes
  useEffect(() => {
    // Skip if this is the initial render or color hasn't actually changed
    if (
      prevColorRef.current &&
      Math.round(prevColorRef.current.r) === Math.round(colorState.r) &&
      Math.round(prevColorRef.current.g) === Math.round(colorState.g) &&
      Math.round(prevColorRef.current.b) === Math.round(colorState.b)
    ) {
      return;
    }

    addColor(colorState.r, colorState.g, colorState.b);
    prevColorRef.current = { r: colorState.r, g: colorState.g, b: colorState.b };
  }, [colorState.r, colorState.g, colorState.b, addColor]);

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
    updateFromHsb(h, s, v);
  };

  const handleHexUpdate = () => {
    updateFromHex(colorState.hexInput);
  };

  // Chatbot hook for conversation history management
  const {
    displayHistory,
    isModalOpen,
    addMessage,
    clearHistory,
    closeModal,
  } = useChatbot();

  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);

  const {
    cssColorsEnabled, setCssColorsEnabled,
    materialColorsEnabled, setMaterialColorsEnabled,
    spectral12ColorsEnabled, setSpectral12ColorsEnabled,
    japaneseColorsEnabled, setJapaneseColorsEnabled,
    rgbGridColorsEnabled, setRgbGridColorsEnabled,
    setColorSets,
  } = useDisplaySettings();

  const isDesktopLayout = useMatchMedia('(min-width: 801px)');

  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('none');

  const {
    bridgeColorA, setBridgeColorA,
    bridgeColorB, setBridgeColorB,
    isBridgeOpen, setIsBridgeOpen,
    isTwoDPickerOpen, setIsTwoDPickerOpen,
  } = useBridgeState({ r: Math.round(colorState.r), g: Math.round(colorState.g), b: Math.round(colorState.b) });

  const { helpRequest, handleHelpClick } = useHelpRequest(i18n.language);

  // Voice command handlers
  const voiceCommandHandlers = {
    updateFromRgb,
    updateRgbValue,
    setShape,
    toggleLabel,
    adjustHslValue,
    updateFromHex,
    getCurrentHex: () => `#${colorState.hexInput}`,
    setHarmonyMode,
    setColorSets,
    setBridgeColorA,
    setBridgeColorB,
    setIsBridgeOpen,
    selectBridgePosition: (position: number) => {
      const [r, g, b] = interpolateRgb(bridgeColorA, bridgeColorB, colorState.shape, position);
      updateFromRgb(r, g, b);
    },
  };

  const harmonyColors = useMemo(
    () => computeHarmonyColors(colorState.h, colorState.s, colorState.l, harmonyMode),
    [colorState.h, colorState.s, colorState.l, harmonyMode]
  );

  const handleWsCommand = (command: VoiceCommand) => {
    executeCommand(command, voiceCommandHandlers);
  };

  // Handle voice recognition transcript
  const handleVoiceTranscript = (transcript: string) => {
    // Always show the user's utterance in the visible chat history immediately.
    if (transcript && transcript.trim()) {
      addMessage({ role: 'user', content: transcript.trim() });
    }
    // WebSocket経由で処理されるため、ここでは何もしない
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
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header
        isDesktopLayout={isDesktopLayout}
        cssColorsEnabled={cssColorsEnabled}
        materialColorsEnabled={materialColorsEnabled}
        spectral12ColorsEnabled={spectral12ColorsEnabled}
        japaneseColorsEnabled={japaneseColorsEnabled}
        rgbGridColorsEnabled={rgbGridColorsEnabled}
        onCssColorsToggle={setCssColorsEnabled}
        onMaterialColorsToggle={setMaterialColorsEnabled}
        onSpectral12ColorsToggle={setSpectral12ColorsEnabled}
        onJapaneseColorsToggle={setJapaneseColorsEnabled}
        onRgbGridColorsToggle={setRgbGridColorsEnabled}
        colorHistory={history}
        onColorSelect={handleClick}
        harmonyMode={harmonyMode}
        onHarmonyModeChange={setHarmonyMode}
        harmonyColors={harmonyColors}
        currentR={colorState.r}
        currentG={colorState.g}
        currentB={colorState.b}
        onHelpClick={handleHelpClick}
      />
      <Structure
        bridgeColorA={isBridgeOpen ? bridgeColorA : undefined}
        bridgeColorB={isBridgeOpen ? bridgeColorB : undefined}
        isBridgeOpen={isBridgeOpen}
        isTwoDPickerOpen={isTwoDPickerOpen}
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
        focusHsvS={colorState.hsbS}
        focusV={colorState.v}
        rgbMainElement={colorState.rgbMainElement}
        cmykMainElement={colorState.cmykMainElement}
        hslMainElement={colorState.hslMainElement}
        hsbMainElement={colorState.hsbMainElement}
        cssColorsEnabled={cssColorsEnabled}
        materialColorsEnabled={materialColorsEnabled}
        spectral12ColorsEnabled={spectral12ColorsEnabled}
        japaneseColorsEnabled={japaneseColorsEnabled}
        rgbGridColorsEnabled={rgbGridColorsEnabled}
        harmonyColors={harmonyColors}
      />
      {isDesktopLayout ? (
        <ControlPane
          bridgeColorA={bridgeColorA}
          bridgeColorB={bridgeColorB}
          onSetBridgeColorA={setBridgeColorA}
          onSetBridgeColorB={setBridgeColorB}
          isBridgeOpen={isBridgeOpen}
          onBridgeOpenChange={setIsBridgeOpen}
          isTwoDPickerOpen={isTwoDPickerOpen}
          onTwoDPickerOpenChange={setIsTwoDPickerOpen}
          onHelpClick={handleHelpClick}
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
          focusHsvS={colorState.hsbS}
          focusV={colorState.v}
          rgbMainElement={colorState.rgbMainElement}
          hslMainElement={colorState.hslMainElement}
          hsbMainElement={colorState.hsbMainElement}
          cmykMainElement={colorState.cmykMainElement}
          setFocusR={(value: number) => updateRgbValue('R', value)}
          setFocusG={(value: number) => updateRgbValue('G', value)}
          setFocusB={(value: number) => updateRgbValue('B', value)}
          hexInput={colorState.hexInput}
          setHexInput={setHexInput}
          onHexUpdate={handleHexUpdate}
        />
      ) : (
        <MobileControlColumn
          bridgeColorA={bridgeColorA}
          bridgeColorB={bridgeColorB}
          onSetBridgeColorA={setBridgeColorA}
          onSetBridgeColorB={setBridgeColorB}
          isBridgeOpen={isBridgeOpen}
          onBridgeOpenChange={setIsBridgeOpen}
          isTwoDPickerOpen={isTwoDPickerOpen}
          onTwoDPickerOpenChange={setIsTwoDPickerOpen}
          onHelpClick={handleHelpClick}
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
          focusHsvS={colorState.hsbS}
          focusV={colorState.v}
          rgbMainElement={colorState.rgbMainElement}
          hslMainElement={colorState.hslMainElement}
          hsbMainElement={colorState.hsbMainElement}
          cmykMainElement={colorState.cmykMainElement}
          setFocusR={(value: number) => updateRgbValue('R', value)}
          setFocusG={(value: number) => updateRgbValue('G', value)}
          setFocusB={(value: number) => updateRgbValue('B', value)}
          hexInput={colorState.hexInput}
          setHexInput={setHexInput}
          onHexUpdate={handleHexUpdate}
          cssColorsEnabled={cssColorsEnabled}
          materialColorsEnabled={materialColorsEnabled}
          spectral12ColorsEnabled={spectral12ColorsEnabled}
          japaneseColorsEnabled={japaneseColorsEnabled}
          rgbGridColorsEnabled={rgbGridColorsEnabled}
          onCssColorsToggle={setCssColorsEnabled}
          onMaterialColorsToggle={setMaterialColorsEnabled}
          onSpectral12ColorsToggle={setSpectral12ColorsEnabled}
          onJapaneseColorsToggle={setJapaneseColorsEnabled}
          onRgbGridColorsToggle={setRgbGridColorsEnabled}
          colorHistory={history}
          onColorSelect={handleClick}
          harmonyMode={harmonyMode}
          onHarmonyModeChange={setHarmonyMode}
          harmonyColors={harmonyColors}
        />
      )}
      <VoiceControl
        currentColorState={colorState}
        bridgeColorA={bridgeColorA}
        bridgeColorB={bridgeColorB}
        colorHistory={history}
        onTranscript={handleVoiceTranscript}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAssistantMessage={handleAssistantMessage}
        onCommand={handleWsCommand}
        onError={handleVoiceError}
        // onOpenChatHistory={openModal}
        isLoading={isLoading}
        helpRequest={helpRequest}
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
