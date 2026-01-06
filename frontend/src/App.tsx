import './App.css';
import ControlPane from './components/ColorPicker/ControlPane';
import Structure from './components/ColorPicker/Structure';
import { useColorState } from './hooks/useColorState';

function App() {
  const {
    colorState,
    updateFromRgb,
    updateFromCmyk,
    updateFromHsl,
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

  return (
    <>
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
    </>
  );
}

export default App;
