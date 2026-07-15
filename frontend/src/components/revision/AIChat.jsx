/**
 * components/revision/AIChat.jsx
 * AI chat interface communicating with Gemini API on the backend.
 * Features stage tracking, role preservation, and session completion.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, CheckCircle, Award, Mic, MicOff, Volume2, Loader2, Radio } from 'lucide-react';
import Button from '../ui/Button';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const TypingIndicator = () => (
  <div className="flex items-center gap-2 p-4">
    <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/20 flex items-center justify-center">
      <Bot size={16} className="text-primary-400" />
    </div>
    <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

const CoachText = ({ content, animate, ready }) => {
  const [visibleText, setVisibleText] = useState(animate ? '' : content);

  useEffect(() => {
    if (!ready) {
      setVisibleText('');
      return undefined;
    }

    if (!animate) {
      setVisibleText(content);
      return undefined;
    }

    setVisibleText('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 3;
      setVisibleText(content.slice(0, index));
      if (index >= content.length) window.clearInterval(timer);
    }, 14);

    return () => window.clearInterval(timer);
  }, [content, animate, ready]);

  if (!ready) {
    return <p className="flex items-center gap-2 text-primary-300"><Volume2 size={15} className="animate-pulse" /> Your mentor is speaking…</p>;
  }

  return <p className="whitespace-pre-wrap">{visibleText}{animate && visibleText.length < content.length && <span className="mentor-cursor" />}</p>;
};

const MentorPresence = ({ stage, isTyping, isSpeaking, role }) => {
  const status = isSpeaking ? 'Your mentor is speaking' : isTyping ? 'Your mentor is thinking' : 'Your mentor is ready to listen';

  return (
    <div className="mentor-presence">
      <div className={`mentor-avatar ${isTyping || isSpeaking ? 'mentor-avatar-active' : ''}`} aria-hidden="true">
        <div className="mentor-hair" />
        <div className="mentor-face">
          <span className="mentor-eye mentor-eye-left" />
          <span className="mentor-eye mentor-eye-right" />
          <span className="mentor-smile" />
        </div>
        <div className="mentor-jacket" />
        <span className="mentor-headset" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-white">{stage === 2 ? 'Connected Concepts Mentor' : 'Your Personal Mentor'}</p>
          <span className="mentor-live-badge"><Radio size={10} /> Live session</span>
        </div>
        <p className="text-xs text-dark-400 mt-1 truncate">{role || (stage === 2 ? 'Connecting your existing knowledge' : 'Guiding your recall, one question at a time')}</p>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-primary-300 shrink-0">
        <span className={`mentor-status-dot ${isTyping || isSpeaking ? 'mentor-status-dot-active' : ''}`} />
        {status}
      </div>
    </div>
  );
};

const MessageBubble = ({ message, animate, mentorTextReady }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 p-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-primary-600 to-violet-600 shadow-glow-sm'
          : 'bg-primary-600/20 border border-primary-500/20'
      }`}>
        {isUser
          ? <User size={15} className="text-white" />
          : <Bot size={15} className="text-primary-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed rounded-2xl ${
        isUser
          ? 'bg-primary-600/10 border border-primary-500/20 text-white rounded-tr-none'
          : 'bg-dark-800/80 border border-dark-700/60 text-dark-200 rounded-tl-none'
      }`}>
        {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <CoachText content={message.content} animate={animate} ready={!animate || mentorTextReady} />}
        <div className={`text-[10px] mt-1.5 text-right ${isUser ? 'text-primary-300/85' : 'text-dark-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const AIChat = ({ topic = null, apiKey = '' }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI revision assistant powered by Gemini. Select a topic and let's start your revision session! I can quiz you, explain concepts, or help you recall key information.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeStage, setActiveStage] = useState(1);
  const [chosenRole, setChosenRole] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Assessment State
  const [confidence, setConfidence] = useState('medium');
  const [selfAssessment, setSelfAssessment] = useState('okay');
  const [sessionNotes, setSessionNotes] = useState('');

  // Voice (STS) State
  const [compatibility, setCompatibility] = useState({ stt: true, tts: true });
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVoiceInitializing, setIsVoiceInitializing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMentorNarrating, setIsMentorNarrating] = useState(false);
  const [mentorTextReady, setMentorTextReady] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [liveVoiceCaption, setLiveVoiceCaption] = useState('');

  const ttsRef = useRef(null);
  const sttRef = useRef(null);
  const voiceEnabledRef = useRef(false);
  const messagesEndRef = useRef(null);
  const lastNarratedMessageRef = useRef(messages[0]);

  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);

  // Check browser compatibility on mount
  useEffect(() => {
    const checkCompatibility = async () => {
      try {
        const { getCompatibilityInfo } = await import('speech-to-speech');
        const info = getCompatibilityInfo();
        setCompatibility({ stt: !!info.stt, tts: !!info.tts });
      } catch (err) {
        setCompatibility({ stt: true, tts: true });
      }
    };
    checkCompatibility();
  }, []);

  // Cleanup voice session on unmount
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
        sttRef.current?.stop();
        sttRef.current?.destroy();
        ttsRef.current?.dispose();
      } catch (err) {
        // Ignore
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  // In text mode, let the mentor speak a new response before revealing its text.
  // The dedicated voice mode already speaks responses through Piper, so it is left unchanged.
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'assistant' || latestMessage === lastNarratedMessageRef.current) return undefined;

    lastNarratedMessageRef.current = latestMessage;
    if (isVoiceEnabled || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setMentorTextReady(true);
      return undefined;
    }

    setMentorTextReady(false);
    setIsMentorNarrating(true);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(latestMessage.content);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsMentorNarrating(false);
      setMentorTextReady(true);
    };
    utterance.onerror = () => {
      setIsMentorNarrating(false);
      setMentorTextReady(true);
    };
    window.speechSynthesis.speak(utterance);

    return undefined;
  }, [messages, isVoiceEnabled]);

  // Handle Topic Selection/Change
  useEffect(() => {
    setActiveStage(1);
    if (topic && apiKey) {
      const initializeChat = async () => {
        setIsTyping(true);
        setMessages([]);
        setChosenRole(null);
        setIsCompleted(false);
        setShowAssessment(false);
        try {
          const { data } = await API.post('/ai/chat', {
            topicId: topic._id,
            messages: [],
            apiKey,
            stage: 1,
          });

          if (data.success) {
            setMessages([
              {
                role: 'assistant',
                content: data.data.content,
                timestamp: new Date(),
              },
            ]);
            setChosenRole(data.data.chosenRole);
            setIsCompleted(data.data.isCompleted);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to initialize AI Coach');
          // Add fallback local message
          setMessages([
            {
              role: 'assistant',
              content: `Failed to connect with AI Coach. Please check if your backend server is running and your API Key is valid.`,
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      };
      initializeChat();
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your AI revision assistant powered by Gemini. Select a topic from the dropdown to start your revision session!",
          timestamp: new Date(),
        },
      ]);
      setChosenRole(null);
      setIsCompleted(false);
      setShowAssessment(false);
    }
  }, [topic, apiKey]);

  const startStageTwo = async () => {
    if (!topic) {
      toast.error('Select a topic before starting Stage 2');
      return;
    }

    if (isVoiceEnabled) disableVoiceSession();
    setActiveStage(2);
    setIsTyping(true);
    setMessages([]);
    setChosenRole(null);
    setIsCompleted(false);
    setShowAssessment(false);

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
      setMessages([{ role: 'assistant', content: 'I could not start Stage 2. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const enableVoiceSession = async () => {
    if (!compatibility.stt || !compatibility.tts) {
      toast.error('Voice revision is not fully supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }
    
    setIsVoiceEnabled(true);
    setIsVoiceInitializing(true);
    
    try {
      const { TTSLogic, STTLogic, sharedAudioPlayer } = await import('speech-to-speech');
      
      sharedAudioPlayer.stopAndClearQueue();
      sharedAudioPlayer.configure({ autoPlay: true });
      
      ttsRef.current = new TTSLogic({ voiceId: 'en_US-hfc_female-medium' });
      await ttsRef.current.initialize();
      
      sharedAudioPlayer.setPlayingChangeCallback((isPlaying) => {
        setIsSpeaking(isPlaying);
        if (isPlaying) {
          sttRef.current?.stop();
          setIsListening(false);
        } else {
          if (voiceEnabledRef.current) {
            sttRef.current?.start();
            setIsListening(true);
          }
        }
      });
      
      sttRef.current = new STTLogic(
        (msg, level) => console.log(`[STT ${level}] ${msg}`),
        async (finalTranscript) => {
          if (finalTranscript.trim().length > 2) {
            setLiveVoiceCaption('');
            const userMsg = {
              role: 'user',
              content: finalTranscript.trim(),
              timestamp: new Date()
            };
            setMessages(prev => [...prev, userMsg]);
            await handleVoiceMessageSend(finalTranscript.trim());
          } else {
            sttRef.current?.clearTranscript();
            if (voiceEnabledRef.current) {
              sttRef.current?.start();
              setIsListening(true);
            }
          }
        },
        {
          continueOnSilence: false,
          silenceThresholdMs: 1500,
          onInterimTranscript: (liveText) => {
            setLiveVoiceCaption(liveText);
          }
        }
      );
      
      sttRef.current.start();
      setIsListening(true);
      setIsVoiceInitializing(false);
      toast.success('AI Voice Coach initialized. Start speaking!');
    } catch (err) {
      console.error('Failed to start voice session:', err);
      toast.error('Failed to initialize speech engines. Please check mic permissions.');
      disableVoiceSession();
    }
  };

  const disableVoiceSession = async () => {
    setIsVoiceEnabled(false);
    setIsVoiceInitializing(false);
    setIsListening(false);
    setIsSpeaking(false);
    setLiveVoiceCaption('');
    
    try {
      const { sharedAudioPlayer } = await import('speech-to-speech');
      sharedAudioPlayer.stopAndClearQueue();
      sttRef.current?.stop();
      sttRef.current?.destroy();
      sttRef.current = null;
      ttsRef.current?.dispose();
      ttsRef.current = null;
    } catch (err) {
      // Ignore
    }
  };

  const handleVoiceMessageSend = async (text) => {
    setIsTyping(true);
    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    
    try {
      const { data } = await API.post('/ai/chat', {
        topicId: topic?._id,
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        chosenRole,
        apiKey,
        stage: activeStage,
      });

      if (data.success) {
        const aiResponse = data.data.content;
        
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
          },
        ]);
        setChosenRole(data.data.chosenRole);
        
        if (data.data.isCompleted) {
          setIsCompleted(true);
          if (activeStage === 1) {
            toast.success('Stage 1 complete! You can now continue to Stage 2 or save this session.');
          } else {
            setShowAssessment(true);
            toast.success('Your connected mental map is complete! 🎓');
          }
          disableVoiceSession();
          return;
        }

        const { cleanTextForTTS, sharedAudioPlayer } = await import('speech-to-speech');
        const cleanText = cleanTextForTTS(aiResponse);
        const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        for (const sentence of sentences) {
          const result = await ttsRef.current.synthesize(sentence);
          sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get voice response from AI Coach');
      if (voiceEnabledRef.current) {
        sttRef.current?.start();
        setIsListening(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await API.post('/ai/chat', {
        topicId: topic?._id,
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        chosenRole,
        apiKey,
        stage: activeStage,
      });

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.content,
            timestamp: new Date(),
          },
        ]);
        setChosenRole(data.data.chosenRole);
        if (data.data.isCompleted) {
          setIsCompleted(true);
          if (activeStage === 1) {
            toast.success('Stage 1 complete! You can now continue to Stage 2 or save this session.');
          } else {
            setShowAssessment(true);
            toast.success('Your connected mental map is complete! 🎓');
          }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message to AI Coach');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveSession = async () => {
    if (savingSession) return;
    setSavingSession(false);
    setSavingSession(true);

    try {
      const { data } = await API.post('/ai/complete', {
        topicId: topic._id,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        confidenceLevel: confidence,
        selfAssessment,
        notes: sessionNotes || 'Revised via Stage 1 AI Memory Coach',
      });

      if (data.success) {
        toast.success('Revision session saved and streak updated! 🎉');
        setShowAssessment(false);
        // Clear session
        clearChat();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save revision session');
    } finally {
      setSavingSession(false);
    }
  };

  const clearChat = () => {
    if (isVoiceEnabled) {
      disableVoiceSession();
    }
    
    setActiveStage(1);

    if (topic) {
      // Re-initialize for selected topic
      const initializeChat = async () => {
        setIsTyping(true);
        setMessages([]);
        setChosenRole(null);
        setIsCompleted(false);
        setShowAssessment(false);
        try {
          const { data } = await API.post('/ai/chat', {
            topicId: topic._id,
            messages: [],
            apiKey,
            stage: 1,
          });

          if (data.success) {
            setMessages([
              {
                role: 'assistant',
                content: data.data.content,
                timestamp: new Date(),
              },
            ]);
            setChosenRole(data.data.chosenRole);
            setIsCompleted(data.data.isCompleted);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to restart AI Coach');
        } finally {
          setIsTyping(false);
        }
      };
      initializeChat();
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your AI revision assistant powered by Gemini. Select a topic and let's start your revision session!",
          timestamp: new Date(),
        },
      ]);
      setChosenRole(null);
      setIsCompleted(false);
      setShowAssessment(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Compute stats for turn counter
  const userTurns = messages.filter((m) => m.role === 'user').length;

  if (!apiKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dark-900/10 backdrop-blur-sm h-full min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white shadow-glow mb-4">
          <Bot size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Unlock Your AI Memory Coach</h3>
        <p className="text-sm text-dark-400 max-w-md mb-6">
          Your AI revision coach is ready to help you memorize, quiz, and study. Please enter your Gemini API Key in the banner above to activate the Socratic mentor session.
        </p>
        <div className="text-xs text-dark-500 flex items-center gap-1.5 bg-dark-800/60 px-3 py-1.5 rounded-lg border border-dark-700/50">
          <Sparkles size={12} className="text-primary-400" />
          Client-side security: Your API key is stored locally in your browser.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Stages Navigation Bar */}
      <div className="flex border-b border-dark-700/50 bg-dark-900/40 p-2.5 shrink-0 justify-between items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (activeStage === 2) clearChat();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeStage === 1
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200 border border-transparent'
            }`}
          >
            <Sparkles size={13} className="text-primary-400" />
            Stage 1: Memory Coach
          </button>
          
          <button
            onClick={startStageTwo}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border ${
              activeStage === 2
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : 'text-dark-300 hover:text-white hover:bg-dark-800 border-dark-700/60 disabled:text-dark-600 disabled:cursor-not-allowed'
            }`}
            title="Open Stage 2: Connected Concepts"
          >
            <span>Stage 2: Connected Concepts</span>
          </button>
        </div>
        
        {chosenRole && (
          <div className="flex items-center gap-2">
            <div className="text-[11px] px-2 py-0.5 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-300 font-medium">
              Role: {chosenRole}
            </div>
            {userTurns > 0 && (
              <div className="text-[11px] px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700/80 text-dark-400 font-medium">
                Turn {userTurns} / 6
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 pt-3">
          <MentorPresence
            stage={activeStage}
            isTyping={isTyping}
            isSpeaking={isSpeaking || isMentorNarrating}
            role={chosenRole}
          />
        </div>
        {messages.map((message, idx) => (
          <MessageBubble
            key={idx}
            message={message}
            animate={message.role === 'assistant' && idx === messages.length - 1 && !isTyping}
            mentorTextReady={mentorTextReady}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Interface Container */}
      <div className="p-4 border-t border-dark-700/50 shrink-0 bg-dark-850/20">
        {isCompleted ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 shadow-glow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                <Award size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {activeStage === 1 ? 'Stage 1 Complete!' : 'Connected Mental Map Complete!'}
                </h4>
                <p className="text-xs text-dark-400">
                  {activeStage === 1
                    ? 'Continue to Stage 2 to connect this topic with earlier knowledge, or save this session.'
                    : 'Save the session notes to record your spaced repetition score.'}
                </p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              {activeStage === 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startStageTwo}
                  className="flex-1 sm:flex-none"
                >
                  Start Stage 2
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => setShowAssessment(true)}
                className="flex-1 sm:flex-none"
              >
                Complete & Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {isVoiceEnabled ? (
              <div className="flex flex-col gap-3 p-4 bg-dark-900/60 border border-primary-500/20 rounded-xl relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 pointer-events-none transition-all duration-500 bg-gradient-to-r ${
                  isSpeaking 
                    ? 'from-violet-500 to-primary-500 animate-pulse' 
                    : isListening 
                    ? 'from-emerald-500 to-teal-500' 
                    : 'from-dark-800 to-dark-700'
                }`} />

                <div className="flex items-center justify-between gap-4 z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isVoiceInitializing
                        ? 'bg-dark-800 text-dark-400'
                        : isSpeaking
                        ? 'bg-violet-500/20 text-violet-400 shadow-glow-violet scale-105'
                        : isListening
                        ? 'bg-emerald-500/25 text-emerald-400 animate-pulse scale-105'
                        : 'bg-dark-800 text-dark-500'
                    }`}>
                      {isVoiceInitializing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                      ) : isSpeaking ? (
                        <Volume2 size={20} className="animate-bounce text-violet-400" />
                      ) : isListening ? (
                        <Mic size={20} className="text-emerald-400" />
                      ) : (
                        <MicOff size={20} className="text-dark-500" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {isVoiceInitializing 
                          ? 'Initializing Voice Coach...' 
                          : isSpeaking 
                          ? 'AI Coach is speaking...' 
                          : isListening 
                          ? 'Listening... Speak now' 
                          : 'AI Coach is thinking...'}
                      </h4>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {isVoiceInitializing 
                          ? 'Downloading speech models (only takes a few seconds on first load)...' 
                          : isSpeaking 
                          ? 'Listen to your Socratic mentor.' 
                          : isListening 
                          ? 'Pause for 1.5s when you finish speaking to auto-submit.' 
                          : 'Analyzing your response...'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={disableVoiceSession}
                    className="px-3 py-1.5 rounded-lg border border-dark-700 hover:border-red-500/30 text-xs font-semibold text-dark-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
                  >
                    Exit Voice
                  </button>
                </div>

                {!isVoiceInitializing && (
                  <div className="min-h-12 bg-dark-900/80 border border-dark-800 p-3 rounded-lg flex items-center justify-center text-center z-10 transition-all duration-250">
                    {liveVoiceCaption ? (
                      <p className="text-sm text-white font-medium italic">"{liveVoiceCaption}"</p>
                    ) : isListening ? (
                      <p className="text-xs text-dark-500 font-medium">Say something like: "I think closures are..."</p>
                    ) : isSpeaking ? (
                      <p className="text-xs text-violet-400/90 font-medium tracking-wide">Synthesizing audio turns...</p>
                    ) : (
                      <p className="text-xs text-dark-500 font-medium">Coach is thinking...</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                {compatibility.stt && compatibility.tts && (
                  <button
                    type="button"
                    onClick={enableVoiceSession}
                    disabled={!topic || isTyping}
                    className="px-3.5 py-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-primary-500/40 text-dark-400 hover:text-primary-300 transition-all duration-200 shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Start Voice Revision"
                  >
                    <Mic size={18} />
                  </button>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={topic ? "Chat with your coach... (Enter to send)" : "Select a topic above to begin..."}
                  disabled={!topic || isTyping}
                  rows={1}
                  className="input-field flex-1 resize-none min-h-[44px] max-h-32 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ lineHeight: '1.4' }}
                />
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping || !topic}
                  className="px-4 py-3 shrink-0"
                >
                  <Send size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment Modal Overlay */}
      {showAssessment && (
        <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-2 text-green-400">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Revision Session Complete!</h3>
              <p className="text-xs text-dark-400">
                Rate your understanding to update your spaced repetition database.
              </p>
            </div>

            <div className="space-y-4">
              {/* Confidence Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">Confidence Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setConfidence(level)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                        confidence === level
                          ? level === 'high'
                            ? 'bg-green-500/20 border-green-500/40 text-green-300'
                            : level === 'medium'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'bg-dark-900/50 border-dark-700/60 text-dark-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Self Assessment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">How was the revision?</label>
                <div className="grid grid-cols-4 gap-2">
                  {['easy', 'okay', 'hard', 'very_hard'].map((assessment) => (
                    <button
                      key={assessment}
                      type="button"
                      onClick={() => setSelfAssessment(assessment)}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-bold capitalize transition-all duration-200 ${
                        selfAssessment === assessment
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                          : 'bg-dark-900/50 border-dark-700/60 text-dark-400 hover:text-white'
                      }`}
                    >
                      {assessment.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-350">Session Notes / Key takeaways</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Summarize what you learned or key items to review..."
                  rows={3}
                  className="input-field w-full text-xs py-2 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssessment(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-700 hover:border-dark-600 text-xs font-medium text-dark-300 hover:text-white transition-colors"
              >
                Back to Chat
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={savingSession}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-xs font-semibold text-white shadow-glow-sm transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                {savingSession ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
