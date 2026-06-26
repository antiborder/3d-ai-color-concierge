interface UseColorHandlersParams {
  hexInput: string;
  updateFromRgb: (r: number, g: number, b: number) => void;
  updateFromHsb: (h: number, s: number, v: number) => void;
  updateFromHex: (hex: string) => void;
  updateRgbValue: (param: 'R' | 'G' | 'B', value: number) => void;
  updateCmykValue: (param: 'C' | 'M' | 'Y' | 'K', value: number) => void;
  updateHslValue: (param: 'H' | 'S' | 'L', value: number) => void;
  updateHsvValue: (param: 'H' | 'HsvS' | 'V', value: number) => void;
}

export function useColorHandlers({
  hexInput,
  updateFromRgb,
  updateFromHsb,
  updateFromHex,
  updateRgbValue,
  updateCmykValue,
  updateHslValue,
  updateHsvValue,
}: UseColorHandlersParams) {
  const handleRgbChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'R' | 'G' | 'B'
  ) => updateRgbValue(colorParam, Number(event.target.value));

  const handleCmykChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'C' | 'M' | 'Y' | 'K'
  ) => updateCmykValue(colorParam, Number(event.target.value));

  const handleHslChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'H' | 'S' | 'L'
  ) => updateHslValue(colorParam, Number(event.target.value));

  const handleHsvChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'H' | 'HsvS' | 'V'
  ) => updateHsvValue(colorParam, Number(event.target.value));

  const handleClick = (r: number, g: number, b: number) => updateFromRgb(r, g, b);
  const handleHsvElementClick = (h: number, s: number, v: number) => updateFromHsb(h, s, v);
  const handleHexUpdate = () => updateFromHex(hexInput);

  return {
    handleRgbChange,
    handleCmykChange,
    handleHslChange,
    handleHsvChange,
    handleClick,
    handleHsvElementClick,
    handleHexUpdate,
  };
}
