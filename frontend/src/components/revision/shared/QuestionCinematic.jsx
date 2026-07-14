import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QuestionCinematic
 * Props:
 *   question   – string (the question text)
 *   subtext    – string (optional label, e.g. "Match the output")
 *   code       – string (optional code snippet)
 *   onReady    – called when animation finishes and question is fully visible
 *   accentColor – tailwind color key: 'amber'|'purple'|'indigo'|'red' (default 'blue')
 */
const QuestionCinematic = ({ question, subtext, code, onReady, accentColor = 'blue' }) => {
  // phases: 'enter' (moves from side) -> 'center' (waits) -> 'reveal' (disappears and question shows)
  const [phase, setPhase] = useState('enter');

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    // 1. Enter from side to center takes 1 second
    const t1 = setTimeout(() => setPhase('center'), 1000);
    // 2. Stay in center for 1.5 seconds, then reveal question
    const t2 = setTimeout(() => {
      setPhase('reveal');
      if (onReadyRef.current) onReadyRef.current();
    }, 2500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const glowMap = {
    blue:   'rgba(59,130,246,0.6)',
    amber:  'rgba(245,158,11,0.6)',
    purple: 'rgba(168,85,247,0.6)',
    indigo: 'rgba(99,102,241,0.6)',
    red:    'rgba(239,68,68,0.6)',
  };
  const glow = glowMap[accentColor] ?? glowMap.blue;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-dark-900/50 flex flex-col md:flex-row items-center justify-center p-6 md:p-8 gap-6" style={{ minHeight: 360 }}>
      {/* ── Background Styling ───────────────────────── */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[45%]"
          style={{ background: 'linear-gradient(180deg, #151821 0%, #0d1117 100%)' }} />
        <div className="absolute top-0 left-0 right-0 h-[55%]"
          style={{ background: 'linear-gradient(180deg, #1f2533 0%, #151821 100%)' }} />
      </div>

      {/* ── Serving Girl Character ────────────────────── */}
      <motion.div
        className="relative z-10 flex items-center justify-center shrink-0"
        initial={{ x: '-150%', opacity: 0 }}
        animate={{ 
          x: phase === 'reveal' ? '0%' : '0%',
          opacity: 1,
          scale: phase === 'reveal' ? 0.95 : 1
        }}
        transition={{ type: 'spring', stiffness: 85, damping: 15 }}
      >
        <div className="relative w-44 h-44 md:w-52 md:h-52">
          {/* Platter glow and sparkles in reveal phase */}
          {phase === 'reveal' && (
            <motion.div 
              className="absolute inset-0 z-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Glow right behind the platter area */}
              <div 
                className="absolute top-[45%] right-[10%] w-16 h-16 rounded-full filter blur-[15px] animate-pulse"
                style={{ backgroundColor: glow }}
              />
            </motion.div>
          )}

          <img 
            src="/serving_girl.png" 
            alt="Serving Girl" 
            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
          />

          {/* Covered dish tag in preparation phase */}
          {(phase === 'enter' || phase === 'center') && (
            <motion.div 
              className="absolute top-8 right-2 bg-amber-500/90 text-dark-950 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-glow-sm border border-amber-300 z-20"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              Serving... 🍽️
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Holographic Question Panel ─────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="holo-panel"
            className="w-full max-w-md relative z-20"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="w-full relative rounded-2xl p-px"
              style={{ background: `linear-gradient(135deg, ${glow}, rgba(255,255,255,0.1), ${glow})`,
                       boxShadow: `0 0 30px ${glow}33` }}>
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(16px)' }}>

                {/* Scan line */}
                <motion.div
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                />

                {/* AI label */}
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: glow }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <span className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: glow }}>AI Chef's Special</span>
                </div>

                {/* Subtext */}
                {subtext && (
                  <span className="text-xs font-bold uppercase tracking-wider mb-2 block"
                    style={{ color: glow }}>{subtext}</span>
                )}

                {/* Question text */}
                <motion.p
                  className="text-white font-semibold text-sm md:text-base leading-snug mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {question}
                </motion.p>

                {/* Code block */}
                {code && (
                  <motion.div
                    className="rounded-lg p-4 font-mono text-xs text-green-400 mb-2 overflow-x-auto"
                    style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${glow}55` }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <pre><code>{code}</code></pre>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionCinematic;
