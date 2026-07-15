/**
 * components/revision/stages/MissionStage.jsx
 * Stage 5 – AI-powered coding mission adapted as a revision stage.
 */

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import {
  Target, Sparkles, Send, RotateCcw, Save,
  Loader2, ArrowRight
} from 'lucide-react';
import API from '../../../api/axios';
import MissionCard from '../../mission/MissionCard';
import EvaluationPanel from '../../mission/EvaluationPanel';
import Button from '../../ui/Button';

const MissionStage = ({ onComplete, topic }) => {
  const [step, setStep] = useState('setup'); // setup | coding | evaluation
  
  // Mission state
  const [mission, setMission] = useState(null);
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // UI state
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef(null);
  const startTimeRef = useRef(null);

  const topicName = topic?.title || 'JavaScript Closures';
  const subject = topic?.subject || 'JavaScript';

  // Auto-generation on mount based on the selected topic
  useEffect(() => {
    if (!topic || generating || mission) return;

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
        const { data } = await API.post('/missions/generate', {
          phase: autoPhase,
          weakConcepts: autoWeak,
          strongConcepts: autoStrong,
          difficulty: 'intermediate',
          availableMinutes: 15,
          topicIds: autoTopicIds,
        });
        
        setMission(data.data);
        setCode(data.data.starterCode || '');
        
        // Start coding step immediately
        await API.put(`/missions/${data.data._id}/start`);
        startTimeRef.current = Date.now();
        setStep('coding');
        toast.success('Coding Mission Generated! 🚀');
      } catch (err) {
        console.error('Auto mission generation failed:', err);
        toast.error('Failed to generate custom coding mission. Please retry.');
      } finally {
        setGenerating(false);
      }
    };

    autoGenerate();
  }, [topic, retryCount]);

  // Autosave draft every 30s while coding
  useEffect(() => {
    if (step !== 'coding' || !mission) return;
    autosaveRef.current = setInterval(() => {
      if (code.trim()) saveDraft(true);
    }, 30000);
    return () => clearInterval(autosaveRef.current);
  }, [step, mission, code]);

  // ── Save Draft ───────────────────────────────────────────────────────────────
  const saveDraft = async (silent = false) => {
    if (!mission || !code.trim()) return;
    setSaving(true);
    try {
      await API.put(`/missions/${mission._id}/save`, { code });
      if (!silent) toast.success('Draft saved!');
    } catch {
      if (!silent) toast.error('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit Code ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Write some code before submitting!');
      return;
    }
    setSubmitting(true);
    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    try {
      const { data } = await API.post(`/missions/${mission._id}/submit`, {
        code,
        timeTakenSeconds: timeTaken,
      });
      setEvaluation(data.data);
      setStep('evaluation');
      toast.success('Code evaluated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMission(null);
    setCode('');
    setEvaluation(null);
    setStep('setup');
    setRetryCount(r => r + 1); // Trigger autoGenerate again
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-3 shadow-glow-sm">
          <Target size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Coding Mission</h2>
        <p className="text-dark-400 text-sm mt-1">Apply your concepts in a real task</p>
      </div>

      {/* ── STEP: SETUP / GENERATING ────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
          {generating ? (
            <>
              <Loader2 size={40} className="animate-spin text-primary-400" />
              <div className="space-y-1">
                <p className="text-white font-semibold text-base animate-pulse">Gemini is crafting a custom mission...</p>
                <p className="text-dark-400 text-sm">Designing a coding challenge for topic: <span className="text-primary-400 font-bold">{topicName}</span></p>
              </div>
            </>
          ) : (
            <>
              <p className="text-red-400 font-semibold">Could not generate the coding mission.</p>
              <Button onClick={handleReset} variant="primary">
                Retry Generation
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── STEP: CODING ────────────────────────────────────────────────────── */}
      {step === 'coding' && mission && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start animate-fade-in">
          {/* Left: Mission Info */}
          <div className="space-y-4">
            <MissionCard mission={mission} />
          </div>

          {/* Right: Monaco Editor */}
          <div className="space-y-3 w-full">
            <div className="glass-card overflow-hidden">
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-700/50 bg-dark-900/80">
                <span className="text-xs text-dark-400 font-mono">mission.js</span>
                <button onClick={() => saveDraft(false)} disabled={saving}
                  className="flex items-center gap-1.5 text-xs text-dark-450 hover:text-white">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Draft
                </button>
              </div>
              <Editor
                height="450px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontFamily: '"Fira Code", "Cascadia Code", monospace',
                  fontLigatures: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
            <Button onClick={handleSubmit} disabled={submitting} variant="primary" className="w-full">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Grading Code with Gemini...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={16} /> Submit Code for Evaluation
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: EVALUATION ────────────────────────────────────────────────── */}
      {step === 'evaluation' && evaluation && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <EvaluationPanel evaluation={evaluation} />
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-dark-700/50 bg-dark-900/80">
                <span className="text-xs text-dark-400">Your Submitted Code</span>
              </div>
              <Editor
                height="450px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on' }}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={14} /> Try Another Mission
              </span>
            </Button>
            <Button onClick={onComplete} variant="primary" className="flex-1">
              <span className="flex items-center justify-center gap-2">
                Continue <ArrowRight size={14} />
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionStage;
