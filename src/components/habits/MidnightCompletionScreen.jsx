import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONFETTI_COLORS = ['#7C5CFC', '#4ECDC4', '#FF9F45', '#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D'];

function launchConfetti() {
  if (typeof window === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: Math.random() * 9 + 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltAngleInc: Math.random() * 0.07 + 0.04,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3.5 + 2,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));

  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tiltAngle);
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      }
      ctx.restore();
      p.tiltAngle += p.tiltAngleInc;
      p.y += p.vy; p.x += p.vx;
      p.tilt = Math.sin(p.tiltAngle) * 12;
    });
    frame++;
    if (frame < 200) requestAnimationFrame(draw);
    else document.body.removeChild(canvas);
  };
  requestAnimationFrame(draw);
}

export default function MidnightCompletionScreen({ completedCount, totalCount, onClose }) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isPerfect = percent === 100;

  useEffect(() => { if (isPerfect) setTimeout(launchConfetti, 400); }, [isPerfect]);

  const getMessage = () => {
    if (percent === 100) return { title: 'Perfect Day! 🎉', sub: 'You completed every single habit today. Incredible!' };
    if (percent >= 80) return { title: 'Outstanding! ✨', sub: `${percent}% completion — amazing consistency!` };
    if (percent >= 60) return { title: 'Good Progress 💪', sub: 'Progress matters more than perfection.' };
    if (percent >= 40) return { title: 'Keep Building 🌱', sub: 'One tough day won\'t erase your progress.' };
    return { title: 'Every Step Counts 🤍', sub: 'You showed up. That\'s what matters.' };
  };

  const { title, sub } = getMessage();
  const ringColor = isPerfect ? '#FFD93D' : percent >= 60 ? '#4ECDC4' : '#7C5CFC';
  const circumference = 2 * Math.PI * 52;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col items-center justify-center text-center px-6 py-10 min-h-[65vh]"
    >
      {/* Animated score ring */}
      <div className="relative mb-8">
        {isPerfect && (
          <motion.div className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ['0 0 0 0 #FFD93D40', '0 0 40px 12px #FFD93D10', '0 0 0 0 #FFD93D40'] }}
            transition={{ repeat: Infinity, duration: 2.5 }} />
        )}
        <svg width="130" height="130" className="-rotate-90">
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <motion.circle cx="65" cy="65" r="52" fill="none"
            stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isPerfect ? (
            <motion.div animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}>
              <Star className="h-9 w-9 text-yellow-400 fill-yellow-400" />
            </motion.div>
          ) : (
            <>
              <p className="text-3xl font-bold text-white font-space">{percent}%</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">done</p>
            </>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-2xl font-bold font-space text-white mb-2 leading-tight">{title}</h2>
        <p className="text-sm text-white/55 leading-relaxed max-w-xs">{sub}</p>
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="text-xs text-white/40 bg-white/8 rounded-full px-3 py-1">
            {completedCount} completed
          </span>
          <span className="text-xs text-white/40 bg-white/8 rounded-full px-3 py-1">
            {totalCount - completedCount} missed
          </span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
        className="mt-10 w-full max-w-xs">
        <Button onClick={onClose}
          className="w-full h-13 rounded-2xl font-semibold text-sm shadow-2xl border-0"
          style={{ background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)', color: '#0a0a0a', height: '52px' }}>
          <Sparkles className="h-4 w-4 mr-2 opacity-60" />
          Close & Rest Well
        </Button>
      </motion.div>
    </motion.div>
  );
}