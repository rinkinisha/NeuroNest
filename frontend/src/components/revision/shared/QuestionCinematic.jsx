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
    <div className="relative w-full overflow-hidden rounded-2xl bg-dark-900/50" style={{ minHeight: 340 }}>
      {/* ── Background Styling ───────────────────────── */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[45%]"
          style={{ background: 'linear-gradient(180deg, #151821 0%, #0d1117 100%)' }} />
        <div className="absolute top-0 left-0 right-0 h-[55%]"
          style={{ background: 'linear-gradient(180deg, #1f2533 0%, #151821 100%)' }} />
      </div>

      {/* ── GIF Animation ────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'enter' || phase === 'center') && (
          <motion.div
            key="gif-animation"
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ x: '-150%', opacity: 0 }}
            animate={{ x: phase === 'enter' || phase === 'center' ? '0%' : '150%', opacity: 1 }}
            exit={{ scale: 0, opacity: 0, rotate: 15 }}
            transition={{ 
              x: { type: 'spring', stiffness: 80, damping: 15 },
              exit: { duration: 0.4 }
            }}
          >
            <img 
              src="/ninja.gif" 
              alt="Action Animation" 
              className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Holographic Question Panel ─────────────────── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="holo-panel"
            className="absolute inset-0 flex items-center justify-center p-6 z-20"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 14 }}
          >
            <div className="w-full max-w-md relative rounded-2xl p-px"
              style={{ background: `linear-gradient(135deg, ${glow}, rgba(255,255,255,0.1), ${glow})`,
                       boxShadow: `0 0 30px ${glow}, 0 0 60px ${glow}33` }}>
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
                    style={{ color: glow }}>AI Tutor</span>
                </div>

                {/* Subtext */}
                {subtext && (
                  <span className="text-xs font-bold uppercase tracking-wider mb-2 block"
                    style={{ color: glow }}>{subtext}</span>
                )}

                {/* Question text */}
                <motion.p
                  className="text-white font-semibold text-lg leading-snug mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {question}
                </motion.p>

                {/* Code block */}
                {code && (
                  <motion.div
                    className="rounded-lg p-4 font-mono text-sm text-green-400 mb-2 overflow-x-auto"
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
