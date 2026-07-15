/**
 * components/revision/AIChat.jsx
 * Mentor-centric immersive layout for AI Revision (Stage 1 & 2).
 * Chat bubbles and send inputs removed in favour of a full-screen
 * voice-first mentor room. All existing logic is preserved;
 * only the render layer is replaced.
 *
 * Architecture notes (for voice/animation additions):
 *  - MentorAvatar   : isolated animated component (Framer Motion) – see MentorAvatar.jsx
 *  - MentorStatus   : status badge – controls Listening / Speaking / Thinking / Idle
 *  - TranscriptPanel: bottom panel – wire live STT text here
 *  - MentorRoom     : full-screen wrapper – swap background texture here
 *  - SessionControls: floating action row – add mic/stop buttons here
 */

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Bot, CheckCircle, Award, Mic,
  VolumeX, Loader2, BookOpen, ArrowRight,
} from 'lucide-react';
import Button from '../ui/Button';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import MentorAvatar, { AVATAR_STATE } from './MentorAvatar';

// ─── Status enum – aliased to AVATAR_STATE for interop ───────────────────────
const STATUS = AVATAR_STATE;

// ─── MentorStatus badge ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  [STATUS.IDLE]:      { label: 'Ready',     color: 'text-dark-400',    dot: 'bg-dark-500',     ring: 'border-dark-600/50'   },
  [STATUS.THINKING]:  { label: 'Thinking…', color: 'text-amber-300',   dot: 'bg-amber-400',    ring: 'border-amber-400/40'  },
  [STATUS.SPEAKING]:  { label: 'Speaking',  color: 'text-violet-300',  dot: 'bg-violet-400',   ring: 'border-violet-400/40' },
  [STATUS.LISTENING]: { label: 'Listening', color: 'text-emerald-300', dot: 'bg-emerald-400',  ring: 'border-emerald-400/40'},
};

const MentorStatus = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[STATUS.IDLE];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm bg-dark-900/60 ${cfg.ring} transition-all duration-500`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${status !== STATUS.IDLE ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-semibold tracking-wide ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
};

// MentorAvatar is now imported from ./MentorAvatar.jsx (Framer Motion animated).

// ─── MentorMessage display (replaces chat bubbles) ────────────────────────────
const MentorMessageCard = ({ content, turnCount, totalTurns }) => {
  if (!content) return null;
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative bg-dark-800/70 backdrop-blur-md border border-dark-700/60 rounded-2xl px-6 py-5 shadow-xl">
        {/* Decorative left accent bar */}
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-500/60 via-violet-500/60 to-transparent rounded-full" />
        <p className="text-sm md:text-base text-dark-100 leading-relaxed whitespace-pre-wrap">{content}</p>
        {totalTurns > 0 && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-5 rounded-full transition-all duration-300 ${
                    i < totalTurns ? 'bg-primary-500' : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-dark-500">Turn {totalTurns} / 6</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TranscriptPanel ──────────────────────────────────────────────────────────
// Bottom panel reserved for live STT text. Wire liveCaption prop here later.
const TranscriptPanel = ({ liveCaption, status, isVoiceEnabled }) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className={`rounded-2xl border backdrop-blur-md px-5 py-4 min-h-[72px] flex items-center justify-center text-center transition-all duration-500 ${
      status === STATUS.LISTENING
        ? 'bg-emerald-900/20 border-emerald-500/30'
        : status === STATUS.SPEAKING
        ? 'bg-violet-900/20 border-violet-500/30'
        : 'bg-dark-900/50 border-dark-700/40'
    }`}>
      {liveCaption ? (
        <p className="text-sm text-white font-medium italic">"{liveCaption}"</p>
      ) : status === STATUS.LISTENING ? (
        <p className="text-xs text-emerald-300/80">Speak now — pause for 1.5 s to submit</p>
      ) : status === STATUS.SPEAKING ? (
        <p className="text-xs text-violet-300/80">Your mentor is speaking…</p>
      ) : status === STATUS.THINKING ? (
        <p className="text-xs text-amber-300/60 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> Analysing your response…
        </p>
      ) : !isVoiceEnabled ? (
        <p className="text-xs text-dark-600">Voice transcript will appear here during voice sessions</p>
      ) : (
        <p className="text-xs text-dark-500">Waiting for your reply…</p>
      )}
    </div>
  </div>
);

// ─── SessionControls (mic / exit buttons) ─────────────────────────────────────
// Add mic waveform / stop icons here in later stages.
const SessionControls = ({
  status, isVoiceEnabled, isVoiceInitializing, compatibility,
  topic, onEnableVoice, onDisableVoice,
}) => (
  <div className="flex items-center gap-3">
    {isVoiceEnabled ? (
      <button
        onClick={onDisableVoice}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all duration-200"
      >
        <VolumeX size={14} />
        Exit Voice
      </button>
    ) : (
      compatibility.stt && compatibility.tts && (
        <button
          onClick={onEnableVoice}
          disabled={!topic}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-500/30 bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isVoiceInitializing ? (
            <><Loader2 size={14} className="animate-spin" />Initialising…</>
          ) : (
            <><Mic size={14} />Start Voice Session</>
          )}
        </button>
      )
    )}
  </div>
);

// ─── AIChat (main component) ──────────────────────────────────────────────────
const AIChat = ({ topic = null, apiKey = '' }) => {
  // Session state
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeStage, setActiveStage] = useState(1);
  const [chosenRole, setChosenRole] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Assessment state
  const [confidence, setConfidence] = useState('medium');
  const [selfAssessment, setSelfAssessment] = useState('okay');
  const [sessionNotes, setSessionNotes] = useState('');

  // Voice (STS) state
  const [compatibility, setCompatibility] = useState({ stt: true, tts: true });
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVoiceInitializing, setIsVoiceInitializing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMentorNarrating, setIsMentorNarrating] = useState(false);
  const [mentorTextReady, setMentorTextReady] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [liveVoiceCaption, setLiveVoiceCaption] = useState('');

  // Speech duration tracking — passed to MentorAvatar for animation sync
  const [speechDuration, setSpeechDuration] = useState(null);
  const speechStartRef = useRef(null);

  const ttsRef = useRef(null);
  const sttRef = useRef(null);
  const voiceEnabledRef = useRef(false);
  const lastNarratedMessageRef = useRef(null);

  // Estimate speech duration (seconds) from word count — ~140 wpm average pace
  const estimateDuration = (text) => (text.trim().split(/\s+/).length / 140) * 60;

  // Conversation State Machine state
  const [mentorState, setMentorState] = useState(STATUS.IDLE);
  const [mentorEmotion, setMentorEmotion] = useState('neutral');

  // Derive mentor status from the state machine state
  const mentorStatus = mentorState;

  // ─── Session Memory ─────────────────────────────────────────────────────────
  // Tracks per-session student performance so the AI can make personalised
  // references (e.g. "Earlier you seemed unsure about X — let's revisit that.").
  // Architecture note: state is scoped to the current session; the shape is
  // intentionally forward-compatible with a future long-term learner profile.
  const [sessionMemory, setSessionMemory] = useState({
    studentAnswers: [],          // [{ question, answer, emotion, turnIndex }]
    misconceptions: [],          // [{ context, studentAnswer, turnIndex }]
    strongPoints: [],            // [{ context, turnIndex }]
    hintsUsed: 0,                // total hint requests detected
    topicsNeedingRevisit: [],    // deduplicated question-context strings
    overallConfidence: 'unknown', // 'low' | 'medium' | 'high' | 'unknown'
  });

  const resetSessionMemory = () => setSessionMemory({
    studentAnswers: [],
    misconceptions: [],
    strongPoints: [],
    hintsUsed: 0,
    topicsNeedingRevisit: [],
    overallConfidence: 'unknown',
  });

  /**
   * Analyse a completed dialogue turn and update session memory.
   * Called AFTER each AI response so the emotion signal can be used
   * as a proxy for how well the student answered.
   *
   * @param {string} userText        - what the student said
   * @param {string} currentQuestion - last mentor question (captured before state update)
   * @param {string} aiEmotion       - emotion tag on the AI response
   * @param {number} turnIndex       - 1-based user turn counter
   */
  const analyzeAndUpdateMemory = (userText, currentQuestion, aiEmotion, turnIndex) => {
    setSessionMemory(prev => {
      const next = { ...prev };

      // 1. Record the student answer snapshot
      next.studentAnswers = [
        ...prev.studentAnswers,
        {
          question: currentQuestion.slice(0, 120),
          answer: userText.slice(0, 200),
          emotion: aiEmotion,
          turnIndex,
        },
      ];

      // 2. Detect linguistic uncertainty markers in the student's reply
      const uncertaintyPhrases = ['i think', 'maybe', 'not sure', 'i guess', 'possibly', 'i believe', 'probably'];
      const hintPhrases = ["i don't know", 'no idea', 'can you explain', 'help me', 'what does', 'hint'];
      const isUncertain = uncertaintyPhrases.some(p => userText.toLowerCase().includes(p));
      const askedForHint = hintPhrases.some(p => userText.toLowerCase().includes(p));

      // 3. Use AI emotion as a proxy for answer quality
      const studentStruggled = ['encouraging', 'curious'].includes((aiEmotion || '').toLowerCase());
      const studentExcelled  = ['proud', 'happy'].includes((aiEmotion || '').toLowerCase());

      // 4. Update hint counter
      if (askedForHint) next.hintsUsed = prev.hintsUsed + 1;

      // 5. Update rolling confidence estimate
      if (studentExcelled && !isUncertain) {
        next.overallConfidence = 'high';
      } else if (studentStruggled || isUncertain) {
        next.overallConfidence = prev.overallConfidence === 'high' ? 'medium' : 'low';
      } else if (prev.overallConfidence === 'unknown') {
        next.overallConfidence = 'medium';
      }

      // 6. Track topics where student struggled (deduplicated by question snippet)
      if (studentStruggled) {
        const key = currentQuestion.slice(0, 80);
        if (!prev.topicsNeedingRevisit.includes(key)) {
          next.topicsNeedingRevisit = [...prev.topicsNeedingRevisit, key];
          next.misconceptions = [
            ...prev.misconceptions,
            { context: key, studentAnswer: userText.slice(0, 150), turnIndex },
          ];
        }
      }

      // 7. Track strong understanding moments
      if (studentExcelled) {
        next.strongPoints = [...prev.strongPoints, { context: userText.slice(0, 100), turnIndex }];
      }

      return next;
    });
  };

  /**
   * Serialize session memory into a compact string injected into the AI
   * system prompt so the mentor can make personalised back-references.
   */
  const buildMemorySummary = (mem) => {
    if (mem.studentAnswers.length === 0) return '';
    const parts = [];
    if (mem.misconceptions.length > 0) {
      const items = mem.misconceptions
        .map(m => `  • Turn ${m.turnIndex}: "${m.context.trim()}" — Student answered: "${m.studentAnswer.trim()}"`)
        .join('\n');
      parts.push(`Concepts student struggled with:\n${items}`);
    }
    if (mem.strongPoints.length > 0) {
      parts.push(`Solid understanding shown in ${mem.strongPoints.length} turn(s).`);
    }
    if (mem.hintsUsed > 0) parts.push(`Hints requested: ${mem.hintsUsed}.`);
    parts.push(`Student confidence level: ${mem.overallConfidence}.`);
    parts.push(`Turns completed so far: ${mem.studentAnswers.length}.`);
    return parts.join('\n');
  };

  // Latest assistant message (what the mentor last said)
  const latestMentorMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const userTurns = messages.filter(m => m.role === 'user').length;

  useEffect(() => { voiceEnabledRef.current = isVoiceEnabled; }, [isVoiceEnabled]);

  // Track speaking start/end so avatar gets accurate speechDuration
  useEffect(() => {
    if (isSpeaking) {
      speechStartRef.current = Date.now();
    } else if (speechStartRef.current) {
      const elapsed = (Date.now() - speechStartRef.current) / 1000;
      setSpeechDuration(elapsed > 0.5 ? elapsed : null);
      speechStartRef.current = null;
    }
  }, [isSpeaking]);

  // Browser compatibility check
  useEffect(() => {
    (async () => {
      try {
        const { getCompatibilityInfo } = await import('speech-to-speech');
        const info = getCompatibilityInfo();
        setCompatibility({ stt: !!info.stt, tts: !!info.tts });
      } catch { setCompatibility({ stt: true, tts: true }); }
    })();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    try {
      window.speechSynthesis?.cancel();
      sttRef.current?.stop();
      sttRef.current?.destroy();
      ttsRef.current?.dispose();
    } catch { /* ignore */ }
  }, []);

  // Browser TTS narration (text mode only)
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'assistant' || latest === lastNarratedMessageRef.current) return;
    lastNarratedMessageRef.current = latest;

    if (isVoiceEnabled || !('speechSynthesis' in window)) { setMentorTextReady(true); return; }

    // Pre-compute estimated duration so avatar starts animating immediately
    const estimated = estimateDuration(latest.content);
    setSpeechDuration(estimated);

    if (latest.emotion) {
      setMentorEmotion(latest.emotion);
    }

    setMentorTextReady(false);
    setIsMentorNarrating(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latest.content);
    utterance.rate = 0.96;
    utterance.onend  = () => { setIsMentorNarrating(false); setMentorTextReady(true); setSpeechDuration(null); };
    utterance.onerror = () => { setIsMentorNarrating(false); setMentorTextReady(true); setSpeechDuration(null); };
    window.speechSynthesis.speak(utterance);
  }, [messages, isVoiceEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialise chat on topic / API-key change
  useEffect(() => {
    setActiveStage(1);
    resetSessionMemory(); // clear any memory left from a previous topic
    if (topic && apiKey) {
      (async () => {
        setIsTyping(true);
        setMentorState(STATUS.THINKING);
        setMessages([]);
        setChosenRole(null);
        setIsCompleted(false);
        setShowAssessment(false);
        try {
          const { data } = await API.post('/ai/chat', { topicId: topic._id, messages: [], apiKey, stage: 1 });
          if (data.success) {
            setMentorEmotion(data.data.emotion || 'neutral');
            setMessages([{ role: 'assistant', content: data.data.content, emotion: data.data.emotion || 'neutral', timestamp: new Date() }]);
            setChosenRole(data.data.chosenRole);
            setIsCompleted(data.data.isCompleted);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to initialise AI Coach');
          setMessages([{ role: 'assistant', content: 'Failed to connect with AI Coach. Please check your API Key.', timestamp: new Date() }]);
        } finally {
          setIsTyping(false);
          if (!('speechSynthesis' in window)) {
            setMentorState(STATUS.IDLE);
          }
        }
      })();
    } else {
      setMessages([]);
      setChosenRole(null);
      setIsCompleted(false);
      setShowAssessment(false);
      setMentorState(STATUS.IDLE);
    }
  }, [topic, apiKey]);

  // ─── Stage 2 ────────────────────────────────────────────────────────────────
  const startStageTwo = async () => {
    if (!topic) { toast.error('Select a topic before starting Stage 2'); return; }
    if (isVoiceEnabled) disableVoiceSession();
    setActiveStage(2);
    setIsTyping(true);
    setMentorState(STATUS.THINKING);
    setMessages([]);
    setChosenRole(null);
    setIsCompleted(false);
    setShowAssessment(false);
    resetSessionMemory();
    try {
      const { data } = await API.post('/ai/chat', {
        topicId: topic._id,
        messages: [],
        priorConversation: messages.map(({ role, content }) => ({ role, content })),
        apiKey,
        stage: 2,
      });
      if (data.success) {
        setMessages([{ role: 'assistant', content: data.data.content, timestamp: new Date() }]);
        setChosenRole(data.data.chosenRole);
        setIsCompleted(data.data.isCompleted);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start Connected Concepts Coach');
      setMessages([{ role: 'assistant', content: 'Could not start Stage 2. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
      setMentorEmotion('neutral');
      if (!('speechSynthesis' in window)) {
        setMentorState(STATUS.IDLE);
      }
    }
  };

  // ─── Voice session ───────────────────────────────────────────────────────────
  const enableVoiceSession = async () => {
    if (!compatibility.stt || !compatibility.tts) {
      toast.error('Voice revision requires Chrome, Safari, or Edge.'); return;
    }
    setIsVoiceEnabled(true);
    setIsVoiceInitializing(true);
    setMentorState(STATUS.THINKING);
    try {
      const { TTSLogic, STTLogic, sharedAudioPlayer } = await import('speech-to-speech');
      sharedAudioPlayer.stopAndClearQueue();
      sharedAudioPlayer.configure({ autoPlay: true });
      ttsRef.current = new TTSLogic({ voiceId: 'en_US-hfc_female-medium' });
      await ttsRef.current.initialize();

      sharedAudioPlayer.setPlayingChangeCallback((playing) => {
        setIsSpeaking(playing);
        if (playing) {
          sttRef.current?.stop();
          setIsListening(false);
          setMentorState(STATUS.SPEAKING);
        } else if (voiceEnabledRef.current) {
          sttRef.current?.start();
          setIsListening(true);
          setMentorState(STATUS.LISTENING);
          setMentorEmotion('neutral'); // return to neutral on listening
        } else {
          setMentorState(STATUS.IDLE);
          setMentorEmotion('neutral');
        }
      });

      sttRef.current = new STTLogic(
        (msg, level) => console.log(`[STT ${level}] ${msg}`),
        async (finalTranscript) => {
          if (finalTranscript.trim().length > 2) {
            setLiveVoiceCaption('');
            setMessages(prev => [...prev, { role: 'user', content: finalTranscript.trim(), timestamp: new Date() }]);
            setMentorState(STATUS.THINKING);
            setMentorEmotion('thinking');
            await handleVoiceMessageSend(finalTranscript.trim());
          } else {
            sttRef.current?.clearTranscript();
            if (voiceEnabledRef.current) {
              sttRef.current?.start();
              setIsListening(true);
              setMentorState(STATUS.LISTENING);
            }
          }
        },
        { continueOnSilence: false, silenceThresholdMs: 1500, onInterimTranscript: setLiveVoiceCaption }
      );
      sttRef.current.start();
      setIsListening(true);
      setMentorState(STATUS.LISTENING);
      setIsVoiceInitializing(false);
      toast.success('Voice Coach ready — start speaking!');
    } catch (err) {
      console.error('Voice init failed:', err);
      toast.error('Failed to initialise speech engines. Check microphone permissions.');
      disableVoiceSession();
    }
  };

  const disableVoiceSession = async () => {
    setIsVoiceEnabled(false);
    setIsVoiceInitializing(false);
    setIsListening(false);
    setIsSpeaking(false);
    setLiveVoiceCaption('');
    setMentorState(STATUS.IDLE);
    try {
      const { sharedAudioPlayer } = await import('speech-to-speech');
      sharedAudioPlayer.stopAndClearQueue();
      sttRef.current?.stop(); sttRef.current?.destroy(); sttRef.current = null;
      ttsRef.current?.dispose(); ttsRef.current = null;
    } catch { /* ignore */ }
  };

  const handleVoiceMessageSend = async (text) => {
    setIsTyping(true);
    setMentorState(STATUS.THINKING);
    // Capture the current question & turn index BEFORE state updates
    const currentQuestion = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    const turnIndex = messages.filter(m => m.role === 'user').length + 1;
    const updatedMessages = [...messages, { role: 'user', content: text }];
    let success = false;
    try {
      const { data } = await API.post('/ai/chat', {
        topicId: topic?._id,
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        chosenRole, apiKey, stage: activeStage,
        sessionMemory: buildMemorySummary(sessionMemory),
      });
      if (data.success) {
        success = true;
        const aiResponse = data.data.content;
        const responseEmotion = data.data.emotion || 'neutral';
        setMentorEmotion(responseEmotion);
        // Analyse this turn and update session memory for future personalised questions
        analyzeAndUpdateMemory(text, currentQuestion, responseEmotion, turnIndex);
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, emotion: responseEmotion, timestamp: new Date() }]);
        setChosenRole(data.data.chosenRole);
        if (data.data.isCompleted) {
          setIsCompleted(true);
          if (activeStage === 1) toast.success('Stage 1 complete! Continue to Stage 2.');
          else { setShowAssessment(true); toast.success('Connected mental map complete! 🎓'); }
          disableVoiceSession();
          return;
        }
        
        // AI response is ready: transition state to Speaking immediately so synthesis & animations run together
        setMentorState(STATUS.SPEAKING);

        const { cleanTextForTTS, sharedAudioPlayer } = await import('speech-to-speech');
        const sentences = cleanTextForTTS(aiResponse).split(/(?<=[.!?])\s+/).filter(s => s.trim());
        for (const s of sentences) {
          const result = await ttsRef.current.synthesize(s);
          sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
        }
      } else {
        toast.error('Failed to get revision response');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get voice response');
    } finally {
      setIsTyping(false);
      if (!success) {
        if (voiceEnabledRef.current) {
          sttRef.current?.start();
          setIsListening(true);
          setMentorState(STATUS.LISTENING);
        } else {
          setMentorState(STATUS.IDLE);
        }
      }
    }
  };

  // ─── Text-mode send (retained for fallback / accessibility) ──────────────────
  // Note: the text textarea is hidden from the main mentor UI (voice-first),
  // but this handler is kept for programmatic use and future keyboard shortcuts.
  const sendTextMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    // Capture the current question & turn index BEFORE state updates
    const currentQuestion = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    const turnIndex = messages.filter(m => m.role === 'user').length + 1;
    const userMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setMentorState(STATUS.THINKING);
    setMentorEmotion('thinking');
    let success = false;
    try {
      const { data } = await API.post('/ai/chat', {
        topicId: topic?._id,
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        chosenRole, apiKey, stage: activeStage,
        sessionMemory: buildMemorySummary(sessionMemory),
      });
      if (data.success) {
        success = true;
        const responseEmotion = data.data.emotion || 'neutral';
        setMentorEmotion(responseEmotion);
        // Analyse this turn and update session memory for future personalised questions
        analyzeAndUpdateMemory(text.trim(), currentQuestion, responseEmotion, turnIndex);
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.content, emotion: responseEmotion, timestamp: new Date() }]);
        setChosenRole(data.data.chosenRole);
        if (data.data.isCompleted) {
          setIsCompleted(true);
          if (activeStage === 1) toast.success('Stage 1 complete!');
          else { setShowAssessment(true); toast.success('Connected mental map complete! 🎓'); }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsTyping(false);
      if (!success || !('speechSynthesis' in window)) {
        setMentorState(STATUS.IDLE);
        setMentorEmotion('neutral');
      }
    }
  };

  // ─── Save session ────────────────────────────────────────────────────────────
  const handleSaveSession = async () => {
    if (savingSession) return;
    setSavingSession(true);
    try {
      const { data } = await API.post('/ai/complete', {
        topicId: topic._id,
        messages: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
        confidenceLevel: confidence,
        selfAssessment,
        notes: sessionNotes || 'Revised via AI Mentor',
      });
      if (data.success) {
        toast.success('Session saved! Streak updated 🎉');
        setShowAssessment(false);
        clearChat();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    } finally { setSavingSession(false); }
  };

  const clearChat = () => {
    if (isVoiceEnabled) disableVoiceSession();
    setActiveStage(1);
    resetSessionMemory();
    if (topic && apiKey) {
      (async () => {
        setIsTyping(true);
        setMentorState(STATUS.THINKING);
        setMessages([]);
        setChosenRole(null);
        setIsCompleted(false);
        setShowAssessment(false);
        try {
          const { data } = await API.post('/ai/chat', { topicId: topic._id, messages: [], apiKey, stage: 1 });
          if (data.success) {
            setMentorEmotion(data.data.emotion || 'neutral');
            setMessages([{ role: 'assistant', content: data.data.content, emotion: data.data.emotion || 'neutral', timestamp: new Date() }]);
            setChosenRole(data.data.chosenRole);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to restart');
        } finally {
          setIsTyping(false);
          if (!('speechSynthesis' in window)) {
            setMentorState(STATUS.IDLE);
            setMentorEmotion('neutral');
          }
        }
      })();
    } else {
      setMessages([]);
      setChosenRole(null);
      setIsCompleted(false);
      setShowAssessment(false);
      setMentorState(STATUS.IDLE);
    }
  };

  // ─── Unlock gate ─────────────────────────────────────────────────────────────
  if (!apiKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[500px]"
           style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(99,102,241,0.06) 0%, transparent 70%)' }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white shadow-glow mb-5">
          <Bot size={38} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Unlock Your AI Mentor</h3>
        <p className="text-sm text-dark-400 max-w-sm mb-6 leading-relaxed">
          Enter your Gemini API Key in the banner above to start a live mentor session.
        </p>
        <div className="text-xs text-dark-500 flex items-center gap-1.5 bg-dark-800/60 px-3 py-1.5 rounded-lg border border-dark-700/50">
          <Sparkles size={12} className="text-primary-400" />
          Your key is stored locally — never sent to our servers.
        </div>
      </div>
    );
  }

  // ─── MAIN MENTOR ROOM ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full relative overflow-hidden"
         style={{
           background: `
             radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.10) 0%, transparent 55%),
             radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 50%),
             radial-gradient(ellipse at 50% 50%, rgba(17,24,39,0.95) 0%, rgba(9,10,20,1) 100%)
           `,
         }}>

      {/* ── Subtle grid texture overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* ── Top bar: stage tabs + role badge ── */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-dark-700/40 bg-dark-900/50 backdrop-blur-sm shrink-0">
        <div className="flex gap-1.5">
          {/* Stage 1 tab */}
          <button
            onClick={() => activeStage === 2 && clearChat()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeStage === 1
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200 border border-transparent'
            }`}
          >
            <Sparkles size={12} className="text-primary-400" />
            Stage 1
          </button>

          {/* Stage 2 tab */}
          <button
            onClick={startStageTwo}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border ${
              activeStage === 2
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : 'text-dark-300 hover:text-white hover:bg-dark-800 border-dark-700/60'
            }`}
          >
            <BookOpen size={12} />
            Stage 2
          </button>
        </div>

        <div className="flex items-center gap-2">
          {chosenRole && (
            <div className="hidden sm:flex text-[10px] px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700/80 text-dark-400 font-medium">
              {chosenRole}
            </div>
          )}
          <MentorStatus status={mentorStatus} />
        </div>
      </div>

      {/* ── Central mentor area ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 py-8 overflow-y-auto">

        {/* Avatar */}
        <MentorAvatar
          status={mentorStatus}
          stage={activeStage}
          speechDuration={speechDuration}
          emotion={mentorEmotion}
        />

        {/* Mentor's latest message card */}
        {isTyping ? (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-dark-800/60 border border-dark-700/50 rounded-2xl px-6 py-5 flex items-center gap-3">
              <Loader2 size={16} className="text-primary-400 animate-spin shrink-0" />
              <p className="text-sm text-dark-400 italic">
                {activeStage === 2 ? 'Connecting concepts…' : 'Crafting next question…'}
              </p>
            </div>
          </div>
        ) : latestMentorMsg ? (
          <MentorMessageCard
            content={latestMentorMsg.content}
            turnCount={userTurns}
            totalTurns={userTurns}
          />
        ) : topic ? (
          <div className="w-full max-w-2xl mx-auto text-center">
            <div className="bg-dark-800/40 border border-dark-700/40 rounded-2xl px-6 py-6">
              <Loader2 size={20} className="text-primary-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-dark-400">Starting your session…</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto text-center">
            <div className="bg-dark-800/40 border border-dark-700/40 rounded-2xl px-6 py-6">
              <p className="text-dark-500 text-sm">Select a topic above to begin your mentor session.</p>
            </div>
          </div>
        )}

        {/* Session complete CTA */}
        {isCompleted && !showAssessment && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/25">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {activeStage === 1 ? 'Stage 1 Complete!' : 'Mental Map Complete!'}
                  </h4>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {activeStage === 1
                      ? 'Continue to Stage 2 to connect this topic or save your session.'
                      : 'Your connected mental map has been built.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {activeStage === 1 && (
                  <button
                    onClick={startStageTwo}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-semibold transition-all"
                  >
                    Stage 2 <ArrowRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setShowAssessment(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 hover:opacity-90 text-white text-xs font-semibold transition-all"
                >
                  <CheckCircle size={13} /> Save Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: transcript panel + controls ── */}
      <div className="relative z-10 px-4 pb-4 pt-2 border-t border-dark-700/30 bg-dark-950/30 backdrop-blur-sm shrink-0 space-y-3">
        <TranscriptPanel
          liveCaption={liveVoiceCaption}
          status={mentorStatus}
          isVoiceEnabled={isVoiceEnabled}
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SessionControls
            status={mentorStatus}
            isVoiceEnabled={isVoiceEnabled}
            isVoiceInitializing={isVoiceInitializing}
            compatibility={compatibility}
            topic={topic}
            onEnableVoice={enableVoiceSession}
            onDisableVoice={disableVoiceSession}
          />
          <p className="text-[10px] text-dark-600">
            {isVoiceEnabled
              ? 'Voice mode active — your microphone is live.'
              : 'Enable voice to speak directly with your mentor.'}
          </p>
        </div>
      </div>

      {/* ── Assessment modal ── */}
      {showAssessment && (
        <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-2 text-green-400">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Revision Session Complete!</h3>
              <p className="text-xs text-dark-400">Rate your understanding to update your spaced repetition schedule.</p>
            </div>

            <div className="space-y-4">
              {/* Confidence */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">Confidence Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map(level => (
                    <button key={level} onClick={() => setConfidence(level)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                        confidence === level
                          ? level === 'high' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                          : level === 'medium' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'bg-dark-900/50 border-dark-700/60 text-dark-400 hover:text-white'
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Self assessment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">How was the session?</label>
                <div className="grid grid-cols-4 gap-2">
                  {['easy', 'okay', 'hard', 'very_hard'].map(a => (
                    <button key={a} onClick={() => setSelfAssessment(a)}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-bold capitalize transition-all duration-200 ${
                        selfAssessment === a
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                          : 'bg-dark-900/50 border-dark-700/60 text-dark-400 hover:text-white'
                      }`}>
                      {a.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">Session Notes</label>
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Key takeaways or items to revisit…"
                  rows={3}
                  className="input-field w-full text-xs py-2 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAssessment(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-700 hover:border-dark-600 text-xs font-medium text-dark-300 hover:text-white transition-colors">
                Back
              </button>
              <button onClick={handleSaveSession} disabled={savingSession}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 hover:opacity-90 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all">
                {savingSession ? 'Saving…' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
