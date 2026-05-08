import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

const SOUNDS = [
  { id: 'rain',   label: 'Rain',       emoji: '🌧️', type: 'brown' },
  { id: 'forest', label: 'Forest',     emoji: '🌲', type: 'pink'  },
  { id: 'ocean',  label: 'Ocean',      emoji: '🌊', type: 'white' },
  { id: 'fire',   label: 'Campfire',   emoji: '🔥', type: 'brown' },
  { id: 'cafe',   label: 'Café',       emoji: '☕', type: 'pink'  },
] as const;

type NoiseType = 'white' | 'pink' | 'brown';

// Duration of the looped buffer in seconds
const BUFFER_DURATION = 5;

const generateNoiseBuffer = (audioCtx: AudioContext, type: NoiseType): AudioBuffer => {
  const sampleRate = audioCtx.sampleRate;
  const bufferSize = sampleRate * BUFFER_DURATION;
  const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    // Voss-McCartney algorithm for pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750312;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // compensation
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const out = (lastOut + (0.02 * white)) / 1.02;
      data[i] = out * 3.5;
      lastOut = out;
    }
  }

  return buffer;
};

export default function WhiteNoisePlayer() {
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufferCache = useRef<Map<NoiseType, AudioBuffer>>(new Map());

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    return audioCtxRef.current;
  }, []);

  const stop = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const gain = gainRef.current.gain;
      // Smooth fade out
      gain.setValueAtTime(gain.value, ctx.currentTime);
      gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      
      const currentSource = sourceRef.current;
      setTimeout(() => {
        try { currentSource?.stop(); } catch (e) {}
        currentSource?.disconnect();
      }, 250);
    }
    setActive(null);
  }, []);

  const play = useCallback((sound: typeof SOUNDS[number]) => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // Stop current if playing
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current.disconnect();
    }

    // Get or generate buffer
    let buffer = bufferCache.current.get(sound.type as NoiseType);
    if (!buffer) {
      buffer = generateNoiseBuffer(ctx, sound.type as NoiseType);
      bufferCache.current.set(sound.type as NoiseType, buffer);
    }

    // Create and setup gain
    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.connect(ctx.destination);
    }
    
    const gainNode = gainRef.current;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.2);

    // Create and start source
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();

    sourceRef.current = source;
    setActive(sound.id);
  }, [initAudio, volume]);

  const toggle = (sound: typeof SOUNDS[number]) => {
    if (active === sound.id) stop();
    else play(sound);
  };

  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
        sourceRef.current.disconnect();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="glass rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Ambient Sounds</h3>
        <div className="flex items-center gap-2">
          {active ? <Volume2 className="h-3.5 w-3.5 text-accent" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
          <input
            type="range" min={0} max={1} step={0.05}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-20 accent-primary h-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {SOUNDS.map(s => (
          <motion.button
            key={s.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => toggle(s)}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs transition-all ${
              active === s.id
                ? 'bg-accent/20 border border-accent/30 text-accent'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-lg">{s.emoji}</span>
            <span className="text-[9px]">{s.label}</span>
            {active === s.id && (
              <motion.div
                className="flex gap-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-0.5 h-2 bg-accent rounded-full"
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
