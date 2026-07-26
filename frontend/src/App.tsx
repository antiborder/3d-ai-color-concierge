import './App.css';
import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import convert from 'color-convert';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import ControlPane from './components/common/ControlPane';
import Structure from './components/ColorPicker/Structure';
import LanguageSelector from './components/common/LanguageSelector';
import { useMatchMedia } from './hooks/useMatchMedia';
import VoiceControl from './components/VoiceControl/VoiceControl';
import ChatHistoryModal from './components/Chatbot/ChatHistoryModal';
import { useColorState } from './hooks/useColorState';
import { useColorHandlers } from './hooks/useColorHandlers';
import { useColorHistory } from './hooks/useColorHistory';
import { useDisplaySettings } from './hooks/useDisplaySettings';
import { useBridgeState } from './hooks/useBridgeState';
import { useHelpRequest } from './hooks/useHelpRequest';
import { executeCommand } from './utils/commandExecutor';
import EducationalContent from './components/educational/EducationalContent';
import type { Command as VoiceCommand } from './types/voice';
import { useChatbot } from './hooks/useChatbot';
import { type HarmonyMode, computeHarmonyColors } from './utils/colorHarmony';
import { interpolateRgb } from './components/menus/controls/ColorBridge';
import type { AiColorLabel } from './types/structure';

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
    setLabMainElement,
    setLchMainElement,
    setOklchMainElement,
    toggleLabel,
    setHexInput,
    adjustOklchValue,
  } = useColorState();

  // Color history hook
  const { history, addColor } = useColorHistory();
  const prevColorRef = useRef<{ r: number; g: number; b: number } | null>(null);

  // Set to true just before an AI tool call changes the color; CameraController reads and resets it
  const aiColorTriggerRef = useRef(false);
  const [resetCameraZoomSignal, setResetCameraZoomSignal] = useState(0);
  const [harmonyZoomSignal, setHarmonyZoomSignal] = useState(0);

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

  const {
    handleRgbChange,
    handleCmykChange,
    handleHslChange,
    handleHsvChange,
    handleClick,
    handleHsvElementClick,
    handleHexUpdate,
  } = useColorHandlers({
    hexInput: colorState.hexInput,
    updateFromRgb,
    updateFromHsb,
    updateFromHex,
    updateRgbValue,
    updateCmykValue,
    updateHslValue,
    updateHsvValue,
  });

  // Chatbot hook for conversation history management
  const { displayHistory, isModalOpen, addMessage, clearHistory, closeModal } = useChatbot();

  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);

  const {
    cssColorsEnabled,
    setCssColorsEnabled,
    materialColorsEnabled,
    setMaterialColorsEnabled,
    japaneseColorsEnabled,
    setJapaneseColorsEnabled,
    rgbGridColorsEnabled,
    setRgbGridColorsEnabled,
    setColorSets,
  } = useDisplaySettings();

  const isDesktopLayout = useMatchMedia('(min-width: 1000px)');

  const [sceneBackgroundColor, setSceneBackgroundColor] = useState('#000000');
  const [colorTarget, setColorTarget] = useState<'focused' | 'background'>('focused');

  // Background color as RGB components (for slider display in background mode)
  const bgRgb = useMemo(() => {
    const hex = sceneBackgroundColor.replace('#', '');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }, [sceneBackgroundColor]);

  const bgColorFormats = useMemo(() => {
    const { r, g, b } = bgRgb;
    const ri = Math.round(r), gi = Math.round(g), bi = Math.round(b);
    const [c, m, y, k] = convert.rgb.cmyk([ri, gi, bi]);
    const [h, s, l] = convert.rgb.hsl([ri, gi, bi]);
    const [, hsvS, v] = convert.rgb.hsv([ri, gi, bi]);
    return { c, m, y, k, h, s, l, hsvS, v };
  }, [bgRgb]);

  const [previewRgb, setPreviewRgb] = useState<{ r: number; g: number; b: number } | null>(null);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('none');
  const [aiColorLabels, setAiColorLabels] = useState<AiColorLabel[]>([]);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [openCIEPanelSignal, setOpenCIEPanelSignal] = useState(0);
  const activeContentIdRef = useRef<string | null>(null);
  activeContentIdRef.current = activeContentId;

  const {
    bridgeColorA,
    setBridgeColorA,
    bridgeColorB,
    setBridgeColorB,
    isBridgeOpen,
    setIsBridgeOpen,
    isTwoDPickerOpen,
    setIsTwoDPickerOpen,
  } = useBridgeState({
    r: Math.round(colorState.r),
    g: Math.round(colorState.g),
    b: Math.round(colorState.b),
  });

  const { helpRequest, handleHelpClick } = useHelpRequest(i18n.language);

  const routeColorToBackground = (r: number, g: number, b: number) => {
    const ri = Math.round(r), gi = Math.round(g), bi = Math.round(b);
    setSceneBackgroundColor('#' + convert.rgb.hex([ri, gi, bi]));
    addColor(ri, gi, bi);
  };

  // Voice command handlers
  const voiceCommandHandlers = {
    rotateCameraOnColorChange: () => { aiColorTriggerRef.current = true; },
    updateFromRgb,
    updateRgbValue,
    setShape,
    toggleLabel,
    adjustOklchValue,
    updateFromHex,
    getCurrentHex: () => `#${colorState.hexInput}`,
    getCurrentShape: () => colorState.shape,
    setHarmonyMode,
    setColorSets,
    setBridgeColorA,
    setBridgeColorB,
    setIsBridgeOpen,
    selectBridgePosition: (position: number) => {
      const [r, g, b] = interpolateRgb(bridgeColorA, bridgeColorB, colorState.shape, position);
      updateFromRgb(r, g, b);
    },
    showContent: (id: string) => setActiveContentId(id),
    openCIEPanel: () => setOpenCIEPanelSignal((n) => n + 1),
    setAiColorLabels,
    addAllColorsToHistory: (colors: Array<{ r: number; g: number; b: number }>) => {
      for (const c of colors) addColor(c.r, c.g, c.b);
    },
    resetCameraZoom: () => { setResetCameraZoomSignal((n) => n + 1); },
    zoomToHarmony: () => { setHarmonyZoomSignal((n) => n + 1); },
    setSceneBackgroundColor,
    routeColorToBackground,
    setColorTarget,
  };

  const harmonyColors = useMemo(
    () => computeHarmonyColors(colorState.r, colorState.g, colorState.b, harmonyMode),
    [colorState.r, colorState.g, colorState.b, harmonyMode]
  );

  const handleParticleClick = (r: number, g: number, b: number) => {
    if (aiColorLabels.length > 0) {
      const isAiSelected = aiColorLabels.some(
        (c) =>
          Math.round(c.r) === Math.round(r) &&
          Math.round(c.g) === Math.round(g) &&
          Math.round(c.b) === Math.round(b)
      );
      if (!isAiSelected) setAiColorLabels([]);
    }
    if (colorTarget === 'background') {
      routeColorToBackground(r, g, b);
    } else {
      handleClick(r, g, b);
    }
  };

  const handleWsCommand = (command: VoiceCommand) => {
    if (command.action !== 'SHOW_CONTENT' && activeContentIdRef.current !== null) {
      setActiveContentId(null);
    }
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

  // ── Prop groups ────────────────────────────────────────────────────────────

  // True focused color – always from colorState, never overridden by background mode
  const colorValues = {
    shape: colorState.shape,
    focusR: colorState.r,
    focusG: colorState.g,
    focusB: colorState.b,
    focusC: colorState.c,
    focusM: colorState.m,
    focusY: colorState.y,
    focusK: colorState.k,
    focusH: colorState.h,
    focusS: colorState.s,
    focusL: colorState.l,
    focusHsvS: colorState.hsbS,
    focusV: colorState.v,
    rgbMainElement: colorState.rgbMainElement,
    cmykMainElement: colorState.cmykMainElement,
    hslMainElement: colorState.hslMainElement,
    hsbMainElement: colorState.hsbMainElement,
    labMainElement: colorState.labMainElement,
    lchMainElement: colorState.lchMainElement,
    oklchMainElement: colorState.oklchMainElement,
  };

  // In background mode, sliders display & edit background color values
  const controlPaneColorValues = colorTarget === 'background' ? {
    ...colorValues,
    focusR: bgRgb.r,
    focusG: bgRgb.g,
    focusB: bgRgb.b,
    focusC: bgColorFormats.c,
    focusM: bgColorFormats.m,
    focusY: bgColorFormats.y,
    focusK: bgColorFormats.k,
    focusH: bgColorFormats.h,
    focusS: bgColorFormats.s,
    focusL: bgColorFormats.l,
    focusHsvS: bgColorFormats.hsvS,
    focusV: bgColorFormats.v,
  } : colorValues;

  // Background-mode slider handlers: compute result, update background, and add to history
  const bgSliderHandlers = {
    onRgbChange: (e: ChangeEvent<HTMLInputElement>, param: 'R' | 'G' | 'B') => {
      const val = Number(e.target.value);
      routeColorToBackground(
        param === 'R' ? val : bgRgb.r,
        param === 'G' ? val : bgRgb.g,
        param === 'B' ? val : bgRgb.b,
      );
    },
    onCmykChange: (e: ChangeEvent<HTMLInputElement>, param: 'C' | 'M' | 'Y' | 'K') => {
      const val = Number(e.target.value);
      const [r, g, b] = convert.cmyk.rgb([
        param === 'C' ? val : bgColorFormats.c,
        param === 'M' ? val : bgColorFormats.m,
        param === 'Y' ? val : bgColorFormats.y,
        param === 'K' ? val : bgColorFormats.k,
      ]);
      routeColorToBackground(r, g, b);
    },
    onHslChange: (e: ChangeEvent<HTMLInputElement>, param: 'H' | 'S' | 'L') => {
      const val = Number(e.target.value);
      const [r, g, b] = convert.hsl.rgb([
        param === 'H' ? val : bgColorFormats.h,
        param === 'S' ? val : bgColorFormats.s,
        param === 'L' ? val : bgColorFormats.l,
      ]);
      routeColorToBackground(r, g, b);
    },
    onHsvChange: (e: ChangeEvent<HTMLInputElement>, param: 'H' | 'HsvS' | 'V') => {
      const val = Number(e.target.value);
      const [r, g, b] = convert.hsv.rgb([
        param === 'H' ? val : bgColorFormats.h,
        param === 'HsvS' ? val : bgColorFormats.hsvS,
        param === 'V' ? val : bgColorFormats.v,
      ]);
      routeColorToBackground(r, g, b);
    },
    handleClick: routeColorToBackground,
    handleHsvElementClick: (h: number, s: number, v: number) => {
      const [r, g, b] = convert.hsv.rgb([h, s, v]);
      routeColorToBackground(r, g, b);
    },
    setFocusR: (v: number) => routeColorToBackground(Math.round(v), bgRgb.g, bgRgb.b),
    setFocusG: (v: number) => routeColorToBackground(bgRgb.r, Math.round(v), bgRgb.b),
    setFocusB: (v: number) => routeColorToBackground(bgRgb.r, bgRgb.g, Math.round(v)),
  };

  const isBg = colorTarget === 'background';

  const colorHandlers = {
    handleLabel: toggleLabel,
    handleClick: isBg ? bgSliderHandlers.handleClick : handleClick,
    handleHsvElementClick: isBg ? bgSliderHandlers.handleHsvElementClick : handleHsvElementClick,
    onShapeClick: setShape,
    onRgbChange: isBg ? bgSliderHandlers.onRgbChange : handleRgbChange,
    onCmykChange: isBg ? bgSliderHandlers.onCmykChange : handleCmykChange,
    onHslChange: isBg ? bgSliderHandlers.onHslChange : handleHslChange,
    onHsvChange: isBg ? bgSliderHandlers.onHsvChange : handleHsvChange,
    setRgbMainElement,
    setCmykMainElement,
    setHslMainElement,
    setHsvMainElement,
    setLabMainElement,
    setLchMainElement,
    setOklchMainElement,
    setFocusR: isBg ? bgSliderHandlers.setFocusR : (v: number) => updateRgbValue('R', v),
    setFocusG: isBg ? bgSliderHandlers.setFocusG : (v: number) => updateRgbValue('G', v),
    setFocusB: isBg ? bgSliderHandlers.setFocusB : (v: number) => updateRgbValue('B', v),
    setHexInput,
    onHexUpdate: handleHexUpdate,
    onPreviewRgb: (r: number, g: number, b: number) => setPreviewRgb({ r, g, b }),
    onClearPreviewRgb: () => setPreviewRgb(null),
    isPreviewActive: previewRgb !== null,
  };

  const previewColorValues = useMemo(() => {
    if (!previewRgb) return null;
    const ri = Math.round(previewRgb.r);
    const gi = Math.round(previewRgb.g);
    const bi = Math.round(previewRgb.b);
    const [pH, pS, pL] = convert.rgb.hsl([ri, gi, bi]);
    const [, pHsvS, pV] = convert.rgb.hsv([ri, gi, bi]);
    return { focusH: pH, focusS: pS, focusL: pL, focusHsvS: pHsvS, focusV: pV };
  }, [previewRgb]);

  const bridgeForStructure = {
    bridgeColorA: isBridgeOpen ? bridgeColorA : undefined,
    bridgeColorB: isBridgeOpen ? bridgeColorB : undefined,
    isBridgeOpen,
    isTwoDPickerOpen,
  };

  const bridgeForControlPane = {
    bridgeColorA,
    bridgeColorB,
    onSetBridgeColorA: setBridgeColorA,
    onSetBridgeColorB: setBridgeColorB,
    isBridgeOpen,
    onBridgeOpenChange: setIsBridgeOpen,
    isTwoDPickerOpen,
    onTwoDPickerOpenChange: setIsTwoDPickerOpen,
  };

  const displaySettings = {
    cssColorsEnabled,
    materialColorsEnabled,
    japaneseColorsEnabled,
    rgbGridColorsEnabled,
  };

  const displaySettingsHandlers = {
    onCssColorsToggle: setCssColorsEnabled,
    onMaterialColorsToggle: setMaterialColorsEnabled,
    onJapaneseColorsToggle: setJapaneseColorsEnabled,
    onRgbGridColorsToggle: setRgbGridColorsEnabled,
  };

  const harmonyState = {
    harmonyMode,
    onHarmonyModeChange: setHarmonyMode,
    harmonyColors,
  };

  return (
    <>
      <Toaster position="top-right" />
      <LangSelectorWrapper>
        <LanguageSelector />
      </LangSelectorWrapper>
      <Structure
        {...colorValues}
        focusR={previewRgb?.r ?? colorValues.focusR}
        focusG={previewRgb?.g ?? colorValues.focusG}
        focusB={previewRgb?.b ?? colorValues.focusB}
        focusH={previewColorValues?.focusH ?? colorValues.focusH}
        focusS={previewColorValues?.focusS ?? colorValues.focusS}
        focusL={previewColorValues?.focusL ?? colorValues.focusL}
        focusHsvS={previewColorValues?.focusHsvS ?? colorValues.focusHsvS}
        focusV={previewColorValues?.focusV ?? colorValues.focusV}
        {...bridgeForStructure}
        {...displaySettings}
        isLabelShown={colorState.isLabelShown}
        onParticleClick={handleParticleClick}
        onPreviewRgb={(r, g, b) => setPreviewRgb({ r, g, b })}
        onClearPreviewRgb={() => setPreviewRgb(null)}
        onCommitRgb={isBg ? routeColorToBackground : handleClick}
        harmonyColors={harmonyColors}
        aiColorLabels={aiColorLabels}
        sceneBackgroundColor={sceneBackgroundColor}
        rotateCameraRef={aiColorTriggerRef}
        resetCameraZoomSignal={resetCameraZoomSignal}
        harmonyZoomSignal={harmonyZoomSignal}
      />
      <ControlPane
        isDesktopLayout={isDesktopLayout}
        {...controlPaneColorValues}
        {...colorHandlers}
        {...bridgeForControlPane}
        {...displaySettings}
        {...displaySettingsHandlers}
        {...harmonyState}
        hexInput={colorState.hexInput}
        colorHistory={history}
        sceneBackgroundColor={sceneBackgroundColor}
        onBackgroundColorChange={setSceneBackgroundColor}
        selectedRgb={{ r: colorState.r, g: colorState.g, b: colorState.b }}
        colorTarget={colorTarget}
        onColorTargetChange={setColorTarget}
        onHelpClick={handleHelpClick}
        openCIEPanelSignal={openCIEPanelSignal}
      />
      <VoiceControl
        currentColorState={colorState}
        bridgeColorA={bridgeColorA}
        bridgeColorB={bridgeColorB}
        colorHistory={history}
        uiContext={{
          colorSamples: {
            css: cssColorsEnabled,
            material: materialColorsEnabled,
            japanese: japaneseColorsEnabled,
            rgbGrid: rgbGridColorsEnabled,
          },
          activeSlide: activeContentId,
          harmony: harmonyMode,
          colorTarget,
        }}
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
      <EducationalContent
        contentId={activeContentId}
        onClose={() => setActiveContentId(null)}
      />
    </>
  );
}

import styled from 'styled-components';

const LangSelectorWrapper = styled.div`
  position: absolute;
  top: 12px;
  right: 20px;
  z-index: 1001;
`;

export default App;
