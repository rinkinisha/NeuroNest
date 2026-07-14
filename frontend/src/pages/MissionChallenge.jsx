/**
 * pages/MissionChallenge.jsx
 * Stage 5 – AI-powered coding mission with Monaco Editor and Gemini evaluation.
 */

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import {
  Target, Sparkles, Play, Send, RotateCcw, Save,
  ChevronDown, BookOpen, Loader2
} from 'lucide-react';
import API from '../api/axios';
import MissionCard from '../components/mission/MissionCard';
import EvaluationPanel from '../components/mission/EvaluationPanel';
import Loader from '../components/ui/Loader';

// ── Topic Selector ────────────────────────────────────────────────────────────
const PHASES = ['Frontend', 'Backend', 'Fullstack', 'DSA'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const CONCEPT_OPTIONS = [
  'HTML', 'CSS', 'JavaScript', 'Functions', 'Closures', 'DOM',
  'Arrays', 'Objects', 'Promises', 'Async/Await', 'React', 'Node.js',
  'Express', 'REST API', 'MongoDB', 'SQL', 'Git',
];

// ── Main Component ────────────────────────────────────────────────────────────
const MissionChallenge = () => {
  const [step, setStep] = useState('setup'); // setup | coding | evaluation
  const [topics, setTopics] = useState([]);

  // Profile form
  const [phase, setPhase] = useState('Frontend');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [weakConcepts, setWeakConcepts] = useState([]);
  const [strongConcepts, setStrongConcepts] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [availableMinutes, setAvailableMinutes] = useState(12);

  // Mission state
  const [mission, setMission] = useState(null);
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState(null);

  // UI state
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load topics for optional linking
  useEffect(() => {
    API.get('/topics').then(({ data }) => setTopics(data.data || [])).catch(() => {});
  }, []);

  // Autosave draft every 30s while coding
  useEffect(() => {
    if (step !== 'coding' || !mission) return;
    autosaveRef.current = setInterval(() => {
      if (code.trim()) saveDraft(true);
    }, 30000);
    return () => clearInterval(autosaveRef.current);
  }, [step, mission, code]);

  const toggleConcept = (concept, list, setList) => {
    setList((prev) =>
      prev.includes(concept) ? prev.filter((c) => c !== concept) : [...prev, concept]
    );
  };

  // ── Generate Mission ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!weakConcepts.length || !strongConcepts.length) {
      toast.error('Select at least one weak and one strong concept.');
      return;
    }
    setGenerating(true);
    try {
      const { data } = await API.post('/missions/generate', {
        phase,
        weakConcepts,
        strongConcepts,
        difficulty,
        availableMinutes,
        topicIds: selectedTopicIds,
      });
      setMission(data.data);
      setCode(data.data.starterCode || '');
      toast.success('Mission generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate mission.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Start Coding ─────────────────────────────────────────────────────────────
  const handleStartCoding = async () => {
    try {
      await API.put(`/missions/${mission._id}/start`);
      startTimeRef.current = Date.now();
      setStep('coding');
    } catch {
      toast.error('Failed to start mission.');
    }
  };

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

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setMission(null);
    setCode('');
    setEvaluation(null);
    setStep('setup');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="text-primary-400" size={24} />
            Mission Challenge
          </h1>
          <p className="text-dark-400 text-sm mt-1">Stage 5 – Apply your knowledge in a real coding task</p>
        </div>
        {(step === 'coding' || step === 'evaluation') && (
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw size={14} />
            New Mission
          </button>
        )}
      </div>

      {/* ── STEP: SETUP ─────────────────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="space-y-6">
          {/* Profile Form */}
          <div className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-primary-400" />
              Configure Your Mission
            </h2>

            {/* Phase & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">Phase</label>
                <div className="flex flex-wrap gap-2">
                  {PHASES.map((p) => (
                    <button key={p} onClick={() => setPhase(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        phase === p
                          ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                          : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${
                        difficulty === d
                          ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                          : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">
                Available Time: <span className="text-primary-400">{availableMinutes} min</span>
              </label>
              <input type="range" min={5} max={30} value={availableMinutes}
                onChange={(e) => setAvailableMinutes(+e.target.value)}
                className="w-full accent-primary-500" />
            </div>

            {/* Weak Concepts */}
            <div>
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">
                Weak Concepts <span className="text-primary-400">*</span>
                <span className="text-dark-500 ml-1 normal-case">(will be reinforced)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CONCEPT_OPTIONS.map((c) => (
                  <button key={c} onClick={() => toggleConcept(c, weakConcepts, setWeakConcepts)}
                    className={`px-3 py-1 rounded-lg text-xs border ${
                      weakConcepts.includes(c)
                        ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                        : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                    }`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Strong Concepts */}
            <div>
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 block">
                Strong Concepts <span className="text-primary-400">*</span>
                <span className="text-dark-500 ml-1 normal-case">(used as foundation)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CONCEPT_OPTIONS.map((c) => (
                  <button key={c} onClick={() => toggleConcept(c, strongConcepts, setStrongConcepts)}
                    className={`px-3 py-1 rounded-lg text-xs border ${
                      strongConcepts.includes(c)
                        ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                        : 'bg-dark-800/60 border-dark-700/40 text-dark-400 hover:text-white'
                    }`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={generating}
              className="btn-primary flex items-center gap-2 w-full justify-center">
              {generating
                ? <><Loader2 size={16} className="animate-spin" /> Generating Mission...</>
                : <><Sparkles size={16} /> Generate Mission</>}
            </button>
          </div>

          {/* Mission Preview */}
          {mission && (
            <div className="space-y-4">
              <MissionCard mission={mission} />
              <button onClick={handleStartCoding} className="btn-primary flex items-center gap-2 w-full justify-center">
                <Play size={16} />
                Start Coding
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: CODING ────────────────────────────────────────────────────── */}
      {step === 'coding' && mission && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Mission Info */}
          <div className="space-y-4">
            <MissionCard mission={mission} />
          </div>

          {/* Right: Monaco Editor */}
          <div className="space-y-3">
            <div className="glass-card overflow-hidden">
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-700/50 bg-dark-800/80">
                <span className="text-xs text-dark-400 font-mono">mission.js</span>
                <button onClick={() => saveDraft(false)} disabled={saving}
                  className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-white">
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
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary flex items-center gap-2 w-full justify-center">
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Evaluating with Gemini...</>
                : <><Send size={16} /> Submit for Evaluation</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: EVALUATION ────────────────────────────────────────────────── */}
      {step === 'evaluation' && evaluation && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <EvaluationPanel evaluation={evaluation} />
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-dark-700/50 bg-dark-800/80">
              <span className="text-xs text-dark-400">Your Submitted Code</span>
            </div>
            <Editor
              height="500px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionChallenge;
