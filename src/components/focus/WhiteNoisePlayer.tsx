import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

const SOUNDS = [
  { id: 'rain',   label: 'Rain',       emoji: '🌧️', freq: 200,  type: 'brown' },
  { id: 'forest', label: 'Forest',     emoji: '🌲', freq: 400,  type: 'pink'  },
  { id: 'ocean',  label: 'Ocean',      emoji: '🌊', freq: 100,  type: 'white' },
  { id: 'fire',   label: 'Campfire',   emoji: '🔥', freq: 300,  type: 'brown' },
  { id: 'cafe',   label: 'Café',       emoji: '☕', freq: 600,  type: 'pink'  },
];

type NoiseType = 'white' | 'pink' | 'brown';

function createNoiseNode(audioCtx: AudioContext, type: NoiseType) {
  const bufferSize = 4096;
  const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  let lastOut = 0;

  node.onaudioprocess = (e: AudioProcessingEvent) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else if (type === 'pink') {
        output[i] = white * 0.3;
      } else {
        output[i] = white * 0.15;
      }
    }
  };
  return node;
}

export default function WhiteNoisePlayer() {
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const noiseRef = useRef<ScriptProcessorNode | null>(null);

  const stop = () => {
    if (noiseRef.current) { noiseRef.current.disconnect(); noiseRef.current = null; }
    if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null; }
    setActive(null);
  };

  const play = (sound: typeof SOUNDS[0]) => {
    stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);

    const noise = createNoiseNode(ctx, sound.type as NoiseType);
    noise.connect(gain);

    gainRef.current = gain;
    noiseRef.current = noise;
    setActive(sound.id);
  };


  const toggle = (sound: typeof SOUNDS[0]) => {
    if (active === sound.id) stop();
    else play(sound);
  };

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => () => stop(), []);

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