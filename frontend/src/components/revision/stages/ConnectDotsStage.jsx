import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';
import QuestionCinematic from '../shared/QuestionCinematic';

const ConnectDotsStage = ({ onComplete }) => {
  const [cinematicDone, setCinematicDone] = useState(false);
  const [step, setStep] = useState(0);

  const timeline = [
    { label: "Callbacks", desc: "The original way to handle async JS." },
    { label: "Callback Hell", desc: "Nesting became unreadable and messy." },
    { label: "Promises", desc: "Introduced .then() and .catch() chains." },
    { label: "Async/Await", desc: "Cleaner syntax looking like synchronous code." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4"
    >
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-3">
          <Network size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect the Dots</h2>
        <p className="text-dark-400 text-sm mt-1">See the big picture.</p>
      </div>

      <QuestionCinematic
        question="You know Promises well. But do you remember WHY they exist?"
        subtext="Conceptual Thinking"
        accentColor="indigo"
        onReady={() => setCinematicDone(true)}
      />

      {cinematicDone && (
        <motion.div
          className="glass-card p-6 md:p-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-3 max-w-sm mx-auto">
                <button onClick={() => setStep(1)} className="w-full p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-indigo-500/50 transition-colors text-sm text-dark-200 text-left">
                  To replace async/await
                </button>
                <button onClick={() => setStep(2)} className="w-full p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-indigo-500/50 transition-colors text-sm text-dark-200 text-left">
                  Because callbacks became too messy (Callback Hell)
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-red-400 mb-4">Not quite. Async/await came later to build on top of Promises!</p>
              <Button onClick={() => setStep(0)}>Try Again</Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <p className="text-green-400 font-bold mb-6">Exactly! Let's map out the story:</p>
              <div className="flex flex-col items-center gap-2 mb-8 w-full max-w-sm">
                {timeline.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.4 }} className="w-full">
                    <div className="p-4 bg-dark-800/50 border border-indigo-500/30 rounded-xl">
                      <p className="font-bold text-indigo-300">{item.label}</p>
                      <p className="text-xs text-dark-400 mt-1">{item.desc}</p>
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="flex justify-center my-2"><ArrowRight size={16} className="text-dark-500 rotate-90" /></div>
                    )}
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                <Button variant="primary" onClick={onComplete}>Continue</Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ConnectDotsStage;
