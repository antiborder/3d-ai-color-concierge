import convert from 'color-convert';

/**
 * All color formats in a unified structure
 */
export interface AllColorFormats {
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  hsl: [number, number, number];
  hsb: [number, number, number];
  hex: string;
}

/**
 * Color converter utility class
 * Provides methods to convert between different color spaces
 */
export class ColorConverter {
  /**
   * Convert from RGB to all other color formats
   */
  static fromRgb(r: number, g: number, b: number): AllColorFormats {
    const rgb: [number, number, number] = [r, g, b];
    return {
      rgb,
      cmyk: convert.rgb.cmyk(rgb),
      hsl: convert.rgb.hsl(rgb),
      hsb: convert.rgb.hsv(rgb),
      hex: convert.rgb.hex(rgb),
    };
  }

  /**
   * Convert from CMYK to all other color formats
   */
  static fromCmyk(c: number, m: number, y: number, k: number): AllColorFormats {
    const cmyk: [number, number, number, number] = [c, m, y, k];
    const rgb = convert.cmyk.rgb(cmyk);
    return this.fromRgb(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Convert from HSL to all other color formats
   * Preserves the input HSL values instead of recalculating from RGB
   */
  static fromHsl(h: number, s: number, l: number): AllColorFormats {
    const hsl: [number, number, number] = [h, s, l];
    const rgb = convert.hsl.rgb(hsl);
    const cmyk = convert.rgb.cmyk(rgb);
    const hsvValues = convert.rgb.hsv(rgb);
    const hex = convert.rgb.hex(rgb);

    // Preserve input HSL values instead of recalculating from RGB
    return {
      rgb,
      cmyk,
      hsl: [h, s, l], // Use input values, not recalculated
      hsb: hsvValues,
      hex,
    };
  }

  /**
   * Convert from HSV to all other color formats
   */
  static fromHsb(h: number, s: number, v: number): AllColorFormats {
    const hsb: [number, number, number] = [h, s, v];
    const rgb = convert.hsv.rgb(hsb);
    return this.fromRgb(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Convert from HEX to all other color formats
   */
  static fromHex(hex: string): AllColorFormats {
    const rgb = convert.hex.rgb(hex);
    return this.fromRgb(rgb[0], rgb[1], rgb[2]);
  }
}

/** Returns the contrast color (#000000 or #ffffff) that remains readable
 *  against a background that matches the current focus color. */
export function focusContrastColor(focusL: number): '#000000' | '#ffffff' {
  return focusL >= 50 ? '#000000' : '#ffffff';
}
