import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Swords, Ghost, Star } from 'lucide-react';
import Button from '../../ui/Button';
import QuestionCinematic from '../shared/QuestionCinematic';
import confetti from 'canvas-confetti';

const BossBattleStage = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [cinematicDone, setCinematicDone] = useState(false);

  const controls = useAnimation();

  const questions = [
    { q: "Is 'var' block scoped?", a: false },
    { q: "Does 'const' allow mutation of object properties?", a: true },
    { q: "Are arrow functions hoisted?", a: false },
    { q: "Is JS single-threaded?", a: true },
    { q: "Does '==' check for type equality?", a: false },
  ];

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0 && !gameOver) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setGameOver(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, gameOver]);

  useEffect(() => {
    if (bossHealth <= 0 && !gameOver) {
      setGameOver(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [bossHealth, gameOver]);

  const handleStart = () => {
    setShowCinematic(true);
  };

  const handleAnswer = async (answer) => {
    if (gameOver) return;
    const isCorrect = answer === questions[questionIdx].a;
    if (isCorrect) {
      setScore(s => s + 20);
      setBossHealth(h => Math.max(0, h - 20));
    } else {
      await controls.start({ x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } });
    }
    if (questionIdx < questions.length - 1) {
      setQuestionIdx(idx => idx + 1);
    } else {
      setQuestionIdx(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="max-w-xl mx-auto w-full flex flex-col gap-6 py-4 relative"
    >
      <div className="text-center mb-2 shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 mb-3 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <Swords size={24} />
        </div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase tracking-widest">
          Boss Battle
        </h2>
      </div>

      <motion.div animate={controls} className="glass-card border-red-500/30 p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        {/* Boss Area */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-dark-900 rounded-full border-4 border-dark-700 flex items-center justify-center relative mb-4">
            <Ghost size={48} className="text-red-500" />
            <motion.div
              animate={isPlaying && !gameOver ? { y: [-5, 5] } : {}}
              transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
              className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            />
          </div>
          <div className="w-full max-w-xs h-4 bg-dark-900 rounded-full border border-dark-700 overflow-hidden relative">
            <motion.div className="h-full bg-red-500" initial={{ width: '100%' }} animate={{ width: `${bossHealth}%` }} transition={{ duration: 0.3 }} />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{bossHealth} / 100 HP</div>
          </div>
        </div>

        {/* Pre-start */}
        {!showCinematic && !gameOver && (
          <div className="text-center">
            <p className="text-dark-300 mb-6">30 seconds. Fast questions. Wrong answer = Boss Attacks. Defeat the Syntax Specter!</p>
            <Button variant="danger" size="lg" className="w-full font-bold uppercase tracking-wider" onClick={handleStart}>
              Start Battle!
            </Button>
          </div>
        )}

        {/* Cinematic intro before battle */}
        <AnimatePresence>
          {showCinematic && !isPlaying && !gameOver && (
            <motion.div key="cinematic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuestionCinematic
                question={questions[0].q}
                subtext="Boss Round — True or False?"
                accentColor="red"
                onReady={() => { setCinematicDone(true); setIsPlaying(true); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battle playing */}
        {isPlaying && !gameOver && (
          <div className="text-center">
            <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden mb-6">
              <div className={`h-full ${timeLeft > 10 ? 'bg-amber-500' : 'bg-red-500'} transition-all`} style={{ width: `${(timeLeft / 30) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={questionIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="text-xl font-medium text-white mb-8 h-14 flex items-center justify-center"
              >
                {questions[questionIdx].q}
              </motion.p>
            </AnimatePresence>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleAnswer(true)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">TRUE</Button>
              <Button onClick={() => handleAnswer(false)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50">FALSE</Button>
            </div>
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-2 ${bossHealth <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {bossHealth <= 0 ? 'VICTORY!' : 'DEFEAT!'}
            </h3>
            <p className="text-dark-300 mb-6 flex justify-center items-center gap-2">
              <Star className="text-amber-400" size={18} /> Total XP: {score}
            </p>
            <Button variant="primary" onClick={onComplete}>Continue to Reflection</Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BossBattleStage;
