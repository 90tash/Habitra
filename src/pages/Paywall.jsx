import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREMIUM_FEATURES, PREMIUM_PRICE, PREMIUM_PRICE_ANNUAL } from '@/lib/subscription';

export default function Paywall({ onClose, onUpgrade }) {
  const [billingCycle, setBillingCycle] = useState('annual');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(32px)' }}
    >
      {/* Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C5CFC, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4ECDC4, transparent 70%)' }} />

      <div className="relative flex flex-col h-full overflow-y-auto">
        {/* Close */}
        <div className="flex justify-end p-4 pt-14">
          <button onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="flex-1 px-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Habitra Premium</span>
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold font-space text-white leading-tight">
              Unlock Your Full<br />Potential
            </h1>
            <p className="text-sm text-white/55 mt-2">Everything you need to build life-changing habits</p>
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-2.5">
            {PREMIUM_FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="flex items-center gap-3.5 rounded-2xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-2xl">{f.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/45">{f.desc}</p>
                </div>
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              </motion.div>
            ))}
          </motion.div>

          {/* Billing toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-1 flex gap-1"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {['annual', 'monthly'].map(cycle => (
              <button key={cycle} onClick={() => setBillingCycle(cycle)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  billingCycle === cycle ? 'bg-primary text-white shadow-lg' : 'text-white/50 hover:text-white/80'
                }`}>
                {cycle === 'annual' ? `Annual · ${PREMIUM_PRICE_ANNUAL}` : `Monthly · ${PREMIUM_PRICE}`}
                {cycle === 'annual' && (
                  <span className="ml-1.5 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Save 37%</span>
                )}
              </button>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-10 pt-4 space-y-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={() => onUpgrade(billingCycle)}
              className="w-full h-14 rounded-2xl text-base font-bold gap-2 border-0 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #7C5CFC, #A66CFF)' }}>
              <Sparkles className="h-5 w-5" />
              {billingCycle === 'annual' ? `Start Premium · ${PREMIUM_PRICE_ANNUAL}/yr` : `Start Premium · ${PREMIUM_PRICE}/mo`}
            </Button>
          </motion.div>
          <p className="text-[10px] text-white/30 text-center">Cancel anytime · No commitment · 7-day free trial</p>
        </div>
      </div>
    </motion.div>
  );
}
