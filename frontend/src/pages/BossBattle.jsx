/**
 * pages/BossBattle.jsx
 * Stage 6 – Timed quiz battle with XP system, combo bonuses, and results analysis.
 */

import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Swords, Sparkles, Zap, Trophy, RotateCcw, CheckCircle2,
  XCircle, Target, Clock, Flame, Loader2, TrendingDown, Calendar
} from 'lucide-react';
import API from '../api/axios';
import BattleTimer from '../components/battle/BattleTimer';
import XPBar from '../components/battle/XPBar';
import QuestionCard from '../components/battle/QuestionCard';

const PHASES       = ['Frontend', 'Backend', 'Fullstack', 'DSA'];
const CONCEPT_OPTIONS = [
  'HTML', 'CSS', 'JavaScript', 'Functions', 'Closures', 'DOM',
  'Arrays', 'Objects', 'Promises', 'Async/Await', 'React', 'Node.js',
  'Express', 'REST API', 'MongoDB', 'SQL', 'Git',
];

// ── Feedback Overlay ──────────────────────────────────────────────────────────
const AnswerFeedback = ({ result, onContinue }) => {
  if (!result) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`glass-card p-8 text-center space-y-4 max-w-sm mx-4 border-2 ${
        result.isCorrect ? 'border-emerald-500/50' : 'border-red-500/50'
      }`}>
        {result.isCorrect
          ? <CheckCircle2 size={52} className="text-emerald-400 mx-auto" />
          : <XCircle     size={52} className="text-red-400 mx-auto" />}
        <div>
          <h3 className={`text-xl font-bold ${result.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.isCorrect ? 'Correct!' : 'Not Quite'}
          </h3>
          {result.isCorrect && (
            <p className="text-amber-400 font-bold text-lg mt-1">+{result.xpEarned} XP
              {result.comboActive && <span className="text-sm ml-1">({result.comboMultiplier}× combo!)</span>}
            </p>
          )}
          {!result.isCorrect && (
            <p className="text-dark-300 text-sm mt-1">
              Correct answer: <span className="text-white font-medium">{result.correctAnswer}</span>
            </p>
          )}
        </div>
        {result.explanation && (
          <p className="text-dark-300 text-sm bg-dark-800/60 rounded-xl p-3 text-left leading-relaxed">
            {result.explanation}
          </p>
        )}
        <button onClick={onContinue} className="btn-primary w-full">
          {result.isLastQuestion ? 'View Results' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
};

// ── Results Screen ────────────────────────────────────────────────────────────
const ResultsScreen = ({ battle, onRestart }) => {
  const accuracy      = battle.accuracy || 0;
  const grade         = accuracy >= 80 ? { label: 'Legendary!', color: 'text-amber-400', emoji: '🏆' }
                      : accuracy >= 60 ? { label: 'Strong!',    color: 'text-emerald-400', emoji: '⚡' }
                      : accuracy >= 40 ? { label: 'Keep Going', color: 'text-blue-400', emoji: '💪' }
                      :                  { label: 'Try Again',  color: 'text-red-400', emoji: '🔥' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score Hero */}
      <div className="glass-card p-8 text-center space-y-4">
        <div className="text-5xl">{grade.emoji}</div>
        <div>
          <h2 className={`text-3xl font-black ${grade.color}`}>{grade.label}</h2>
          <p className="text-dark-400 text-sm mt-1">Boss Battle Complete</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[
            { icon: Zap,    label: 'XP Earned',   value: battle.totalXp,           color: 'text-amber-400'  },
            { icon: Target, label: 'Accuracy',     value: `${accuracy.toFixed(1)}%`, color: 'text-emerald-400' },
            { icon: Flame,  label: 'Best Combo',   value: `${battle.maxCombo}x`,    color: 'text-red-400'    },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-dark-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
            <Clock size={16} className="text-blue-400 mx-auto mb-1" />
            <p className="text-base font-bold text-white">
              {Math.round(battle.avgResponseTimeMs / 1000)}s avg
            </p>
            <p className="text-xs text-dark-500">Response Time</p>
          </div>
          <div className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
            <Trophy size={16} className="text-violet-400 mx-auto mb-1" />
            <p className="text-base font-bold text-white">
              {battle.correctCount} / {battle.questions?.length}
            </p>
            <p className="text-xs text-dark-500">Correct Answers</p>
          </div>
        </div>
      </div>

      {/* Weak Topics */}
      {battle.weakTopicsDetected?.length > 0 && (
        <div className="glass-card p-5 border border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
            <TrendingDown size={15} />
            Topics Needing Revision
          </h3>
          <div className="flex flex-wrap gap-2">
            {battle.weakTopicsDetected.map((t) => (
              <span key={t} className="badge bg-amber-500/15 text-amber-300 border border-amber-500/25">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Next Revision */}
      {battle.nextRevisionDate && (
        <div className="glass-card p-5 border border-primary-500/20">
          <h3 className="text-sm font-semibold text-primary-300 flex items-center gap-2 mb-1">
            <Calendar size={15} />
            Recommended Next Revision
          </h3>
          <p className="text-dark-300 text-sm">
            {new Date(battle.nextRevisionDate).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      )}

      <button onClick={onRestart} className="btn-secondary w-full flex items-center gap-2 justify-center">
        <RotateCcw size={14} />
        Start New Battle
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const BossBattle = () => {
  const [step, setStep] = useState('setup'); // setup | battle | results
  const [phase, setPhase] = useState('Frontend');
  const [weakConcepts, setWeakConcepts]   = useState([]);
  const [strongConcepts, setStrongConcepts] = useState([]);

  const [battle, setBattle]           = useState(null);
  const [currentQ, setCurrentQ]       = useState(0);
  const [totalXp, setTotalXp]         = useState(0);
  const [comboActive, setComboActive] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [answerResult, setAnswerResult] = useState(null);
  const [timerKey, setTimerKey]       = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [finalizing, setFinalizing]   = useState(false);

  const answerStartRef = useRef(Date.now());

  const toggleConcept = (concept, list, setList) => {
    setList((prev) => prev.includes(concept) ? prev.filter((c) => c !== concept) : [...prev, concept]);
  };

  // ── Generate + Start Battle ─────────────────────────────────────────────────
  const handleStart = async () => {
    if (!weakConcepts.length || !strongConcepts.length) {
      toast.error('Select at least one weak and one strong concept.');
      return;
    }
    setGenerating(true);
    try {
      const genRes  = await API.post('/boss-battle/generate', { phase, weakConcepts, strongConcepts });
      const newBattle = genRes.data.data;
      await API.put(`/boss-battle/${newBattle._id}/start`);
      setBattle(newBattle);
      setCurrentQ(0);
      setTotalXp(0);
      setStep('battle');
      answerStartRef.current = Date.now();
      toast.success('Battle started! 🗡️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start battle.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Submit Answer ───────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (userAnswer) => {
    if (!battle || submittingAnswer) return;
    setSubmittingAnswer(true);
    const responseTimeMs = Date.now() - answerStartRef.current;
    const isLastQuestion = currentQ === battle.questions.length - 1;

    try {
      const { data } = await API.post(`/boss-battle/${battle._id}/answer`, {
        questionIndex: currentQ,
        userAnswer,
        responseTimeMs,
      });
      const result = data.data;
      setTotalXp(result.totalXp);
      setComboActive(result.comboActive);
      setComboMultiplier(result.comboMultiplier);
      setAnswerResult({ ...result, isLastQuestion });
    } catch (err) {
      toast.error('Failed to record answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  }, [battle, currentQ, submittingAnswer]);

  // ── Timer expired: auto-submit blank ────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (!submittingAnswer) handleAnswer('__TIMEOUT__');
  }, [handleAnswer, submittingAnswer]);

  // ── Continue to next question / finalize ────────────────────────────────────
  const handleContinue = async () => {
    setAnswerResult(null);
    if (currentQ >= battle.questions.length - 1) {
      // Last question — finalize
      setFinalizing(true);
      try {
        const { data } = await API.post(`/boss-battle/${battle._id}/submit`);
        setBattle(data.data);
        setStep('results');
      } catch {
        toast.error('Failed to finalize battle.');
      } finally {
        setFinalizing(false);
      }
    } else {
      setCurrentQ((q) => q + 1);
      setTimerKey((k) => k + 1);
      answerStartRef.current = Date.now();
    }
  };

  const handleRestart = () => {
    setBattle(null);
    setCurrentQ(0);
    setTotalXp(0);
    setStep('setup');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Answer Feedback Overlay */}
      {answerResult && <AnswerFeedback result={answerResult} onContinue={handleContinue} />}
      {finalizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 text-center space-y-3">
            <Loader2 size={40} className="animate-spin text-primary-400 mx-auto" />
            <p className="text-white font-semibold">Analyzing your battle...</p>
            <p className="text-dark-400 text-sm">Gemini is evaluating your performance</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Swords className="text-red-400" size={24} />
          Boss Battle
        </h1>
        <p className="text-dark-400 text-sm mt-1">Stage 6 – Rapid recall under time pressure. 15 questions. Prove your mastery.</p>
      </div>

      {/* ── SETUP ───────────────────────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-red-400" />
            Battle Configuration
          </h2>

          {/* Phase */}
          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">Phase</label>
            <div className="flex flex-wrap gap-2">
              {PHASES.map((p) => (
                <button key={p} onClick={() => setPhase(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    phase === p
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          {/* Weak Concepts */}
          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">
              Weak Concepts <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CONCEPT_OPTIONS.map((c) => (
                <button key={c} onClick={() => toggleConcept(c, weakConcepts, setWeakConcepts)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    weakConcepts.includes(c)
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Strong Concepts */}
          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">
              Strong Concepts <span className="text-green-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CONCEPT_OPTIONS.map((c) => (
                <button key={c} onClick={() => toggleConcept(c, strongConcepts, setStrongConcepts)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    strongConcepts.includes(c)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Battle Info */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-dark-800/40 border border-dark-700/30">
            {[
              { label: '15 Questions', icon: Target },
              { label: 'XP Rewards',  icon: Zap    },
              { label: 'Combo Bonus', icon: Flame   },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-dark-300 text-xs">
                <Icon size={14} className="text-red-400 shrink-0" />
                {label}
              </div>
            ))}
          </div>

          <button onClick={handleStart} disabled={generating}
            className="w-full flex items-center gap-2 justify-center py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500
              transition-all duration-200 shadow-lg disabled:opacity-50">
            {generating
              ? <><Loader2 size={16} className="animate-spin" /> Generating Battle...</>
              : <><Swords size={16} /> Begin Boss Battle</>}
          </button>
        </div>
      )}

      {/* ── BATTLE ──────────────────────────────────────────────────────────── */}
      {step === 'battle' && battle && (
        <div className="space-y-4">
          {/* HUD */}
          <div className="glass-card px-5 py-4 flex items-center gap-4">
            <BattleTimer
              isActive={!answerResult && !submittingAnswer}
              onTimeUp={handleTimeUp}
              resetKey={timerKey}
            />
            <div className="flex-1 space-y-2">
              <XPBar totalXp={totalXp} comboActive={comboActive} comboMultiplier={comboMultiplier} />
              <div className="flex items-center justify-between text-xs text-dark-400">
                <span>Question {currentQ + 1} of {battle.questions.length}</span>
                <span className="text-primary-400 font-semibold">{phase}</span>
              </div>
              {/* Progress dots */}
              <div className="flex gap-1 flex-wrap">
                {battle.questions.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < currentQ ? 'bg-primary-500' : i === currentQ ? 'bg-amber-400' : 'bg-dark-700'
                  }`} />
                ))}
              </div>
            </div>
          </div>

          {/* Question */}
          {battle.questions[currentQ] && (
            <QuestionCard
              question={battle.questions[currentQ]}
              questionNumber={currentQ + 1}
              total={battle.questions.length}
              onSubmit={handleAnswer}
              disabled={submittingAnswer || !!answerResult}
            />
          )}
        </div>
      )}

      {/* ── RESULTS ─────────────────────────────────────────────────────────── */}
      {step === 'results' && battle && (
        <ResultsScreen battle={battle} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default BossBattle;
