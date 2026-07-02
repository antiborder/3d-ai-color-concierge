import convert from 'color-convert';

export type WireframeSegment = {
  samples: [number, number, number][]; // RGB 0–255
  lineWidth: number;
};

const RING_N = 65;
const LINE_N = 32;
const EDGE_N = 40;

const CUBE_EDGES: [[number, number, number], [number, number, number]][] = [
  [[0, 0, 0], [255, 0, 0]],
  [[0, 0, 0], [0, 255, 0]],
  [[0, 0, 0], [0, 0, 255]],
  [[255, 0, 0], [255, 255, 0]],
  [[255, 0, 0], [255, 0, 255]],
  [[0, 255, 0], [255, 255, 0]],
  [[0, 255, 0], [0, 255, 255]],
  [[0, 0, 255], [255, 0, 255]],
  [[0, 0, 255], [0, 255, 255]],
  [[255, 255, 0], [255, 255, 255]],
  [[255, 0, 255], [255, 255, 255]],
  [[0, 255, 255], [255, 255, 255]],
];

function cubeEdgeSegments(lineWidth = 1.2): WireframeSegment[] {
  return CUBE_EDGES.map(([a, b]) => ({
    samples: Array.from({ length: EDGE_N }, (_, i) => {
      const t = i / (EDGE_N - 1);
      return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
      ] as [number, number, number];
    }),
    lineWidth,
  }));
}

// H=0–360, S=100, L=50 → pure saturated mid-lightness colors
function hslRingSegment(lineWidth = 1.5): WireframeSegment {
  return {
    samples: Array.from({ length: RING_N }, (_, i) => {
      const h = (i / (RING_N - 1)) * 360;
      return convert.hsl.rgb([Math.round(h), 100, 50]) as [number, number, number];
    }),
    lineWidth,
  };
}

// Fixed HSL hue, L interpolates lFrom→lTo, S=100
function hslLineSegment(hue: number, lFrom: number, lTo: number): WireframeSegment {
  return {
    samples: Array.from({ length: LINE_N }, (_, i) => {
      const t = i / (LINE_N - 1);
      const l = lFrom + (lTo - lFrom) * t;
      return convert.hsl.rgb([Math.round(hue), 100, Math.round(l)]) as [number, number, number];
    }),
    lineWidth: 0.8,
  };
}

// H=0–360, S=100, V=100 → pure saturated bright colors
function hsbRingSegment(): WireframeSegment {
  return {
    samples: Array.from({ length: RING_N }, (_, i) => {
      const h = (i / (RING_N - 1)) * 360;
      return convert.hsv.rgb([Math.round(h), 100, 100]) as [number, number, number];
    }),
    lineWidth: 1.5,
  };
}

// Fixed HSB hue, S=0→100, V=100 (white center → color rim)
function hsbSpokeSegment(hue: number): WireframeSegment {
  return {
    samples: Array.from({ length: LINE_N }, (_, i) => {
      const s = Math.round((i / (LINE_N - 1)) * 100);
      return convert.hsv.rgb([Math.round(hue), s, 100]) as [number, number, number];
    }),
    lineWidth: 0.8,
  };
}

// Fixed HSB hue, S=100, V=100→0 (color rim → black tip)
function hsbSlantSegment(hue: number): WireframeSegment {
  return {
    samples: Array.from({ length: LINE_N }, (_, i) => {
      const v = Math.round(100 - (i / (LINE_N - 1)) * 100);
      return convert.hsv.rgb([Math.round(hue), 100, v]) as [number, number, number];
    }),
    lineWidth: 0.8,
  };
}

// Achromatic gray ramp: (0,0,0) → (255,255,255)
function grayAxisSegment(): WireframeSegment {
  return {
    samples: Array.from({ length: LINE_N }, (_, i) => {
      const v = Math.round((i / (LINE_N - 1)) * 255);
      return [v, v, v] as [number, number, number];
    }),
    lineWidth: 1,
  };
}

export function getWireframeSegments(shape: string): WireframeSegment[] {
  switch (shape) {
    case 'RGB':
    case 'CMYK':
      return cubeEdgeSegments(1.5);

    case 'XYZ':
    case 'xyz':
    case 'xy':
    case 'Lab':
      return cubeEdgeSegments(1.2);

    case 'LCH':
      return [
        ...cubeEdgeSegments(1.2),
        grayAxisSegment(),
      ];

    case 'HSL':
      return [
        hslRingSegment(1.5),
        hslLineSegment(60, 50, 100),  // Yellow → White  (CMY upper)
        hslLineSegment(180, 50, 100), // Cyan   → White
        hslLineSegment(300, 50, 100), // Magenta → White
        hslLineSegment(0, 0, 50),     // Black → Red    (RGB lower)
        hslLineSegment(120, 0, 50),   // Black → Green
        hslLineSegment(240, 0, 50),   // Black → Blue
      ];

    case 'HSB':
      return [
        hsbRingSegment(),
        hsbSpokeSegment(60),  // White → Yellow  (CMY upper)
        hsbSpokeSegment(180), // White → Cyan
        hsbSpokeSegment(300), // White → Magenta
        hsbSlantSegment(0),   // Red   → Black   (RGB lower)
        hsbSlantSegment(120), // Green → Black
        hsbSlantSegment(240), // Blue  → Black
      ];

    default:
      return cubeEdgeSegments(1.2);
  }
}
