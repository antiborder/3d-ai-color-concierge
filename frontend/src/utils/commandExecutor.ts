/**
 * コマンド実行エンジン
 * WebSocket経由で受信したコマンドを実行する
 */
import toast from 'react-hot-toast';
import type { Command } from '@/types/voice';
import type { ColorSpace } from '@/types/color';
import type { HarmonyMode } from './colorHarmony';
import type { AiColorLabel } from '@/types/structure';

/**
 * コマンド実行に必要なハンドラー関数の型定義
 */
export interface VoiceCommandHandlers {
  rotateCameraOnColorChange: () => void;
  updateFromRgb: (r: number, g: number, b: number) => void;
  updateRgbValue: (colorParam: 'R' | 'G' | 'B', value: number) => void;
  setShape: (shape: ColorSpace) => void;
  adjustOklchValue: (
    property: 'brightness' | 'saturation' | 'hue',
    direction: 'up' | 'down',
    amount?: number
  ) => void;
  updateFromHex: (hex: string) => void;
  getCurrentHex: () => string;
  getCurrentShape: () => ColorSpace;
  setHarmonyMode: (mode: HarmonyMode) => void;
  setColorSets: (
    sets: Partial<Record<'css' | 'material' | 'japanese' | 'rgbGrid', boolean>>
  ) => void;
  setBridgeColorA: (c: { r: number; g: number; b: number }) => void;
  setBridgeColorB: (c: { r: number; g: number; b: number }) => void;
  setIsBridgeOpen: (open: boolean) => void;
  selectBridgePosition: (position: number) => void;
  showContent: (id: string) => void;
  openCIEPanel: () => void;
  setAiColorLabels: (labels: AiColorLabel[]) => void;
  addAllColorsToHistory: (colors: Array<{ r: number; g: number; b: number }>) => void;
  resetCameraZoom: () => void;
  zoomToHarmony: () => void;
  setSceneBackgroundColor: (hex: string) => void;
  routeColorToBackground: (r: number, g: number, b: number) => void;
  setColorTarget: (target: 'focused' | 'background') => void;
}

/**
 * コマンドを実行
 */
export function executeCommand(command: Command, handlers: VoiceCommandHandlers): void {
  switch (command.action) {
    case 'SELECT_COLOR': {
      const color = command.parameters.color as { r: number; g: number; b: number };
      const target = command.parameters.target as string | undefined;
      if (
        color &&
        typeof color.r === 'number' &&
        typeof color.g === 'number' &&
        typeof color.b === 'number'
      ) {
        handlers.setAiColorLabels([]);
        if (target === 'background') {
          handlers.setColorTarget('background');
          handlers.routeColorToBackground(color.r, color.g, color.b);
        } else {
          handlers.setColorTarget('focused');
          handlers.rotateCameraOnColorChange();
          handlers.updateFromRgb(color.r, color.g, color.b);
        }
      }
      break;
    }

    case 'SET_COLOR': {
      const target = command.parameters.target as string | undefined;
      if (target === 'background') {
        handlers.setColorTarget('background');
        const { r: cr, g: cg, b: cb } = command.parameters as { r?: number; g?: number; b?: number; target?: string };
        // Read current bg values via routeColorToBackground with channel override handled by caller context;
        // since we only have routeColorToBackground(r,g,b), apply the one changed channel.
        // The bg channel values come from the backend context — just pick the provided channel(s).
        const rVal = typeof cr === 'number' ? cr : NaN;
        const gVal = typeof cg === 'number' ? cg : NaN;
        const bVal = typeof cb === 'number' ? cb : NaN;
        // Only one channel is expected; call routeColorToBackground with all three but fall back caller must handle
        if (!isNaN(rVal) || !isNaN(gVal) || !isNaN(bVal)) {
          // We need the current bg to fill in the unchanged channels — use SET_BACKGROUND_COLOR hex path is simpler.
          // For now route the full rgb if all provided, otherwise toast a note.
          if (!isNaN(rVal) && !isNaN(gVal) && !isNaN(bVal)) {
            handlers.routeColorToBackground(rVal, gVal, bVal);
          } else {
            toast.error('SET_COLOR with target=background requires all three channels.');
          }
        }
      } else {
        handlers.setColorTarget('focused');
        handlers.rotateCameraOnColorChange();
        if ('r' in command.parameters && typeof command.parameters.r === 'number') {
          handlers.updateRgbValue('R', command.parameters.r);
        } else if ('g' in command.parameters && typeof command.parameters.g === 'number') {
          handlers.updateRgbValue('G', command.parameters.g);
        } else if ('b' in command.parameters && typeof command.parameters.b === 'number') {
          handlers.updateRgbValue('B', command.parameters.b);
        }
      }
      break;
    }

    case 'CHANGE_SHAPE': {
      const colorSpace = command.parameters.colorSpace as string;
      const validShapes: ColorSpace[] = ['RGB', 'CMYK', 'HSL', 'HSB', 'Lab', 'LCH', 'OKLAB', 'OKLCH', 'LMS', 'XYZ', 'xyz', 'xy'];
      const matched = validShapes.find((s) => s.toLowerCase() === colorSpace?.toLowerCase());
      if (matched) {
        handlers.resetCameraZoom();
        handlers.setShape(matched);
        if (matched === 'xy' || matched === 'XYZ' || matched === 'xyz') {
          handlers.openCIEPanel();
        }
      }
      break;
    }

    case 'ADJUST_VALUE': {
      const property = command.parameters.property as string;
      const direction = command.parameters.direction as string;
      const amount = command.parameters.amount as number | undefined;

      // Validate property
      if (!property || !['brightness', 'saturation', 'hue'].includes(property)) {
        toast.error(`Invalid property: ${property}. Must be 'brightness', 'saturation', or 'hue'`);
        return;
      }

      // Validate direction
      if (!direction || !['up', 'down'].includes(direction)) {
        toast.error(`Invalid direction: ${direction}. Must be 'up' or 'down'`);
        return;
      }

      // Validate amount if provided
      if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
        toast.error(`Invalid amount: ${amount}. Must be a non-negative number`);
        return;
      }

      handlers.rotateCameraOnColorChange();
      try {
        handlers.adjustOklchValue(
          property as 'brightness' | 'saturation' | 'hue',
          direction as 'up' | 'down',
          amount
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to adjust color value';
        console.error('Adjust value error:', error);
        toast.error(errorMessage);
      }
      break;
    }

    case 'COPY_HEX': {
      const hex = handlers.getCurrentHex();
      const copyViaTextarea = () => {
        const el = document.createElement('textarea');
        el.value = hex;
        el.style.position = 'fixed';
        el.style.top = '-9999px';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.focus();
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        if (ok) {
          toast.success(`Color Code "${hex}" was copied to the clipboard.`);
        } else {
          toast.error('Failed to copy to clipboard.');
        }
      };
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(hex)
          .then(() => {
            toast.success(`Color Code "${hex}" was copied to the clipboard.`);
          })
          .catch(() => {
            copyViaTextarea();
          });
      } else {
        copyViaTextarea();
      }
      break;
    }

    case 'SET_HEX': {
      const raw = command.parameters.hex as string;
      const target = command.parameters.target as string | undefined;
      if (!raw) {
        toast.error('No hex code provided.');
        break;
      }
      const normalized = raw.replace(/^#/, '');
      if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
        toast.error(`Invalid hex code: ${raw}`);
        break;
      }
      if (target === 'background') {
        handlers.setColorTarget('background');
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        handlers.routeColorToBackground(r, g, b);
      } else {
        handlers.setColorTarget('focused');
        handlers.rotateCameraOnColorChange();
        handlers.updateFromHex(normalized);
      }
      break;
    }

    case 'SET_HARMONY': {
      const mode = command.parameters.mode as string;
      const validModes: HarmonyMode[] = [
        'none',
        'complementary',
        'triangle',
        'square',
        'pentagon',
        'hexagon',
        'heptagon',
        'octagon',
        'nonagon',
      ];
      if (validModes.includes(mode as HarmonyMode)) {
        const currentShape = handlers.getCurrentShape();
        if (currentShape === 'xyz' || currentShape === 'xy') {
          handlers.resetCameraZoom();
          handlers.setShape('XYZ');
        }
        handlers.setHarmonyMode(mode as HarmonyMode);
        if (mode !== 'none') handlers.zoomToHarmony();
      } else {
        toast.error(`Invalid harmony mode: ${mode}`);
      }
      break;
    }

    case 'SET_COLOR_SETS': {
      const validKeys = ['css', 'material', 'japanese', 'rgbGrid'] as const;
      const sets: Partial<Record<(typeof validKeys)[number], boolean>> = {};
      for (const key of validKeys) {
        const val = command.parameters[key];
        if (typeof val === 'boolean') {
          sets[key] = val;
        }
      }
      if (Object.keys(sets).length > 0) {
        const currentShape = handlers.getCurrentShape();
        if (currentShape === 'xyz' || currentShape === 'xy') {
          handlers.resetCameraZoom();
          handlers.setShape('XYZ');
        }
        // If any set is being turned ON, exclusively show only those sets (hide all others)
        const hasAnyTrue = Object.values(sets).some((v) => v === true);
        if (hasAnyTrue) {
          const exclusive: Record<(typeof validKeys)[number], boolean> = {
            css: false,
            material: false,
            japanese: false,
            rgbGrid: false,
          };
          for (const key of validKeys) {
            if (sets[key] === true) exclusive[key] = true;
          }
          handlers.setColorSets(exclusive);
        } else {
          handlers.setColorSets(sets);
        }
      }
      break;
    }

    case 'SELECT_BRIDGE_POSITION': {
      const position = command.parameters.position as number;
      if (typeof position === 'number' && position >= 0 && position <= 1) {
        handlers.rotateCameraOnColorChange();
        handlers.setIsBridgeOpen(true);
        handlers.selectBridgePosition(position);
      }
      break;
    }

    case 'SET_BRIDGE_COLOR': {
      const side = command.parameters.side as string;
      const r = command.parameters.r as number;
      const g = command.parameters.g as number;
      const b = command.parameters.b as number;
      handlers.setIsBridgeOpen(true);
      if (side === 'left') {
        handlers.setBridgeColorA({ r, g, b });
      } else if (side === 'right') {
        handlers.setBridgeColorB({ r, g, b });
      }
      break;
    }

    case 'SHOW_CONTENT': {
      const id = command.parameters.id as string;
      if (id) {
        handlers.showContent(id);
      }
      break;
    }

    case 'DISMISS_CONTENT': {
      // App.tsx's handleWsCommand already calls setActiveContentId(null) for any
      // non-SHOW_CONTENT action, so the slide is already dismissed at this point.
      break;
    }

    case 'SHOW_COLOR_LABELS': {
      const colors = (command.parameters.colors ?? []) as AiColorLabel[];
      const seen = new Set<string>();
      const deduped = colors.filter(({ r, g, b }) => {
        const key = `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const clamped = deduped.slice(0, 12);
      if (clamped.length === 0) {
        handlers.setAiColorLabels([]);
      } else {
        handlers.addAllColorsToHistory(clamped);
        handlers.setAiColorLabels(clamped);
      }
      break;
    }

    case 'RESET_ZOOM': {
      handlers.resetCameraZoom();
      break;
    }

    case 'SWITCH_CURSOR': {
      const target = command.parameters.target as string;
      if (target === 'background' || target === 'focused') {
        handlers.setColorTarget(target);
      } else {
        toast.error(`Invalid cursor target: ${target}. Must be 'focused' or 'background'.`);
      }
      break;
    }

    case 'SET_BACKGROUND_COLOR': {
      const raw = command.parameters.hex as string;
      if (!raw) {
        toast.error('No hex code provided for background color.');
        break;
      }
      const normalized = raw.replace(/^#/, '');
      if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
        toast.error(`Invalid hex code for background: ${raw}`);
        break;
      }
      handlers.setSceneBackgroundColor('#' + normalized);
      break;
    }

    default:
      console.warn('Unknown command action:', command.action);
  }
}
