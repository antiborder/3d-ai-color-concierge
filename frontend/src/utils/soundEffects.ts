/**
 * 色空間変形時の効果音を生成・再生するユーティリティ
 */

let audioContext: AudioContext | null = null;

/**
 * AudioContextを取得（必要に応じて作成）
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported:', e);
      return null;
    }
  }
  
  // サスペンド状態の場合は再開
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
}

/**
 * 変形効果音を生成・再生
 * 周波数が変化するスイープ音と、複数の周波数を組み合わせた変形音を生成
 */
export function playTransformSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 0.5; // 500ms（Particlesのアニメーション時間と一致）
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 複数の周波数成分を組み合わせて変形感を出す
  const baseFreq = 200; // ベース周波数
  const sweepFreq = 400; // スイープ周波数
  const harmonicFreq = 300; // 倍音周波数

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = t / duration; // 0 to 1

    // スイープ音（周波数が変化）
    const sweepPhase = 2 * Math.PI * (baseFreq + (sweepFreq - baseFreq) * progress) * t;
    
    // 倍音成分
    const harmonicPhase = 2 * Math.PI * harmonicFreq * t;
    
    // エンベロープ（フェードイン・フェードアウト）
    const envelope = Math.sin(Math.PI * progress) * 0.3; // 音量を抑える
    
    // 複数の周波数を組み合わせ
    const wave = 
      Math.sin(sweepPhase) * 0.6 + 
      Math.sin(harmonicPhase) * 0.3 +
      Math.sin(sweepPhase * 2) * 0.1; // オーバートーン
    
    // 変形感を出すために、少し歪みを加える
    const distorted = Math.tanh(wave * 1.5);
    
    data[i] = distorted * envelope;
  }

  // 音を再生
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  // ゲインノードで音量調整
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.15; // 音量を適切なレベルに調整
  
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start(0);
  
  // 再生終了後にクリーンアップ
  source.onended = () => {
    source.disconnect();
    gainNode.disconnect();
  };
}
