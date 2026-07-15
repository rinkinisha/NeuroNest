/**
 * components/revision/stages/BossBattleStage.jsx
 * Stage 6 – Dynamic quiz battle with XP system, combo bonuses, and results analysis.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Swords, Sparkles, Zap, Trophy, RotateCcw, CheckCircle2,
  XCircle, Target, Clock, Flame, Loader2, TrendingDown, Calendar
} from 'lucide-react';
import API from '../../../api/axios';
import BattleTimer from '../../battle/BattleTimer';
import XPBar from '../../battle/XPBar';
import QuestionCard from '../../battle/QuestionCard';
import Button from '../../ui/Button';

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
              {result.comboActive && <span className="text-sm ml-1 font-normal">({result.comboMultiplier}× combo!)</span>}
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
        <button onClick={onContinue} className="btn-primary w-full py-2.5 rounded-xl font-semibold bg-primary-600 hover:bg-primary-500 text-white text-sm">
          {result.isLastQuestion ? 'View Results' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
};

// ── Results Screen ────────────────────────────────────────────────────────────
const ResultsScreen = ({ battle, onRestart, onComplete }) => {
  const accuracy      = battle?.accuracy || 0;
  const grade         = accuracy >= 80 ? { label: 'Legendary', color: 'text-white', icon: Trophy }
                      : accuracy >= 60 ? { label: 'Strong',    color: 'text-white', icon: Zap }
                      : accuracy >= 40 ? { label: 'Keep Going', color: 'text-dark-200', icon: Target }
                      :                  { label: 'Try Again',  color: 'text-dark-300', icon: Flame };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Score Hero */}
      <div className="glass-card p-8 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <grade.icon size={48} className={grade.color} />
        </div>
        <div>
          <h2 className={`text-3xl font-black ${grade.color}`}>{grade.label}</h2>
          <p className="text-dark-400 text-sm mt-1">Boss Battle Complete</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[
            { icon: Zap,    label: 'XP Earned',   value: battle.totalXp,           color: 'text-white'  },
            { icon: Target, label: 'Accuracy',     value: `${accuracy.toFixed(1)}%`, color: 'text-white' },
            { icon: Flame,  label: 'Best Combo',   value: `${battle.maxCombo}x`,    color: 'text-white'    },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
              <Icon size={18} className={`${color} mx-auto mb-1 opacity-80`} />
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-dark-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
            <Clock size={16} className="text-white mx-auto mb-1 opacity-80" />
            <p className="text-base font-bold text-white">
              {Math.round(battle.avgResponseTimeMs / 1000)}s avg
            </p>
            <p className="text-xs text-dark-500">Response Time</p>
          </div>
          <div className="bg-dark-800/60 rounded-xl p-3 border border-dark-700/40">
            <Trophy size={16} className="text-white mx-auto mb-1 opacity-80" />
            <p className="text-base font-bold text-white">
              {battle.correctCount} / {battle.questions?.length}
            </p>
            <p className="text-xs text-dark-500">Correct Answers</p>
          </div>
        </div>
      </div>

      {/* Weak Topics */}
      {battle.weakTopicsDetected?.length > 0 && (
        <div className="glass-card p-5 border border-dark-700">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <TrendingDown size={15} className="opacity-80" />
            Topics Needing Revision
          </h3>
          <div className="flex flex-wrap gap-2">
            {battle.weakTopicsDetected.map((t) => (
              <span key={t} className="badge bg-dark-700 text-dark-200 border border-dark-600 px-2 py-1 rounded text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Next Revision */}
      {battle.nextRevisionDate && (
        <div className="glass-card p-5 border border-dark-700">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Calendar size={15} className="opacity-80" />
            Recommended Next Revision
          </h3>
          <p className="text-dark-300 text-sm">
            {new Date(battle.nextRevisionDate).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={onRestart} variant="outline" className="flex-1">
          <RotateCcw size={14} className="mr-1.5 inline" /> Restart Battle
        </Button>
        <Button onClick={onComplete} variant="primary" className="flex-1">
          Continue to Reflection <span className="ml-1.5">→</span>
        </Button>
      </div>
    </div>
  );
};

// ── BossBattleStage main component ─────────────────────────────────────────────
const BossBattleStage = ({ onComplete, topic }) => {
  const [step, setStep] = useState('setup'); // setup | battle | results
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
  const [retryCount, setRetryCount] = useState(0);

  const answerStartRef = useRef(Date.now());

  const topicName = topic?.title || 'JavaScript Closures';
  const subject = topic?.subject || 'JavaScript';

  // Auto-generation on mount based on the selected topic
  useEffect(() => {
    if (!topic || generating || battle) return;

    const autoGenerate = async () => {
      setGenerating(true);

      const isBackend = ['backend', 'node', 'express', 'mongodb', 'sql', 'database'].some(k =>
        subject.toLowerCase().includes(k) || topicName.toLowerCase().includes(k)
      );
      const autoPhase = isBackend ? 'Backend' : 'Frontend';
      const autoWeak = [topicName];
      const autoStrong = isBackend ? ['Node.js', 'Express'] : ['JavaScript', 'Functions'];
      const autoTopicIds = topic?._id ? [topic._id] : [];

      try {
        const genRes = await API.post('/boss-battle/generate', {
          phase: autoPhase,
          weakConcepts: autoWeak,
          strongConcepts: autoStrong,
          topicIds: autoTopicIds
        });
        const newBattle = genRes.data.data;
        await API.put(`/boss-battle/${newBattle._id}/start`);
        setBattle(newBattle);
        setCurrentQ(0);
        setTotalXp(0);
        setStep('battle');
        answerStartRef.current = Date.now();
        toast.success('Boss Battle Started! ⚔️');
      } catch (err) {
        console.error('Auto boss battle generation failed:', err);
        toast.error('Failed to start boss battle. Please retry.');
      } finally {
        setGenerating(false);
      }
    };

    autoGenerate();
  }, [topic, retryCount]);

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
    setRetryCount(r => r + 1); // Trigger autoGenerate again
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 py-4">
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

      {/* Header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 mb-3 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
          <Swords size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Boss Battle</h2>
        <p className="text-dark-400 text-sm mt-1">Rapid recall under time pressure</p>
      </div>

      {/* ── STEP: SETUP / GENERATING ────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
          {generating ? (
            <>
              <Loader2 size={40} className="animate-spin text-primary-400" />
              <div className="space-y-1">
                <p className="text-white font-semibold text-base animate-pulse">Preparing the battle arena...</p>
                <p className="text-dark-400 text-sm">Constructing challenges for topic: <span className="text-primary-400 font-bold">{topicName}</span></p>
              </div>
            </>
          ) : (
            <>
              <p className="text-red-400 font-semibold">Could not start the battle.</p>
              <Button onClick={handleRestart} variant="primary">
                Retry Arena Setup
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── BATTLE PLAYING ──────────────────────────────────────────────────── */}
      {step === 'battle' && battle && (
        <div className="space-y-6 animate-fade-in">
          {/* HUD Info */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-dark-900/80 px-4 py-3 rounded-2xl border border-dark-800">
            <XPBar currentXP={totalXp} maxXP={100} />
            <div className="flex items-center gap-4">
              {comboActive && (
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm animate-bounce">
                  <Flame size={16} />
                  <span>{comboMultiplier}× Streak!</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-dark-950 px-3 py-1.5 rounded-xl border border-dark-700">
                <Clock size={14} className="text-dark-450" />
                <BattleTimer key={timerKey} seconds={15} onTimeUp={handleTimeUp} />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={battle.questions[currentQ]}
            onAnswer={handleAnswer}
            disabled={submittingAnswer}
          />
        </div>
      )}

      {/* ── RESULTS ─────────────────────────────────────────────────────────── */}
      {step === 'results' && battle && (
        <ResultsScreen
          battle={battle}
          onRestart={handleRestart}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};

export default BossBattleStage;
