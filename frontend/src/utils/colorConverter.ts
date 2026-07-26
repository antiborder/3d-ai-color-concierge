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
      hex: convert.rgb.hex(rgb).toLowerCase(),
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
    const hex = convert.rgb.hex(rgb).toLowerCase();

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

/** CIE76 (ΔE*ab) — Euclidean distance in Lab space. */
export function deltaEab(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  // Import lazily to avoid circular deps — call site provides Lab values.
  // Lab conversion is handled inline here to keep this file self-contained.
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
    const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
    const X = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / 0.95047;
    const Y = (0.2126729 * rl + 0.7151522 * gl + 0.072175  * bl) / 1.0;
    const Z = (0.0193339 * rl + 0.119192  * gl + 0.9503041 * bl) / 1.08883;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const [L1, a1, b1Lab] = rgbToLab(r1, g1, b1);
  const [L2, a2, b2Lab] = rgbToLab(r2, g2, b2);
  return Math.sqrt((L2 - L1) ** 2 + (a2 - a1) ** 2 + (b2Lab - b1Lab) ** 2);
}
