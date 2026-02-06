import './App.css';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import ControlPane from './components/ColorPicker/ControlPane';
import Structure from './components/ColorPicker/Structure';
import Header from './components/common/Header';
import VoiceControl from './components/VoiceControl/VoiceControl';
import ChatHistoryModal from './components/Chatbot/ChatHistoryModal';
import { useColorState } from './hooks/useColorState';
import { useVoiceCommand } from './hooks/useVoiceCommand';
import { useChatbot } from './hooks/useChatbot';

function App() {
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
    isModalOpen,
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

  // Use voice command hook with conversation history
  const { processCommand } = useVoiceCommand(
    colorState,
    voiceCommandHandlers,
    conversationHistory,
    updateHistory
  );

  // Handle voice recognition transcript
  const handleVoiceTranscript = async (transcript: string) => {
    setIsLoading(true);
    try {
      await processCommand(transcript);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice recognition error:', error);
    setIsLoading(false);
    // Error is already handled by useVoiceCommand with toast notification
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header />
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
        onTranscript={handleVoiceTranscript}
        onError={handleVoiceError}
        onOpenChatHistory={openModal}
        isLoading={isLoading}
      />
      <ChatHistoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        conversationHistory={conversationHistory}
        onClearHistory={clearHistory}
      />
    </>
  );
}

export default App;
