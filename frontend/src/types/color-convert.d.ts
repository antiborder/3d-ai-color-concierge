// Type definitions for color-convert
declare module 'color-convert' {
  interface Convert {
    rgb: {
      hex: (rgb: [number, number, number] | number[]) => string;
      hsl: (rgb: [number, number, number] | number[]) => [number, number, number];
      hsv: (rgb: [number, number, number] | number[]) => [number, number, number];
      cmyk: (rgb: [number, number, number] | number[]) => [number, number, number, number];
    };
    hsl: {
      rgb: (hsl: [number, number, number] | number[]) => [number, number, number];
      hex: (hsl: [number, number, number] | number[]) => string;
      hsv: (hsl: [number, number, number] | number[]) => [number, number, number];
      cmyk: (hsl: [number, number, number] | number[]) => [number, number, number, number];
    };
    hsv: {
      rgb: (hsv: [number, number, number] | number[]) => [number, number, number];
      hex: (hsv: [number, number, number] | number[]) => string;
      hsl: (hsv: [number, number, number] | number[]) => [number, number, number];
      cmyk: (hsv: [number, number, number] | number[]) => [number, number, number, number];
    };
    cmyk: {
      rgb: (cmyk: [number, number, number, number] | number[]) => [number, number, number];
      hex: (cmyk: [number, number, number, number] | number[]) => string;
      hsl: (cmyk: [number, number, number, number] | number[]) => [number, number, number];
      hsv: (cmyk: [number, number, number, number] | number[]) => [number, number, number];
    };
    hex: {
      rgb: (hex: string) => [number, number, number];
      hsl: (hex: string) => [number, number, number];
      hsv: (hex: string) => [number, number, number];
      cmyk: (hex: string) => [number, number, number, number];
    };
  }
  const convert: Convert;
  export default convert;
}
