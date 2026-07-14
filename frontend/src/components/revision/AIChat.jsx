/**
 * components/revision/AIChat.jsx
 * AI chat interface communicating with Gemini API on the backend.
 * Features stage tracking, role preservation, and session completion.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw, CheckCircle, Award } from 'lucide-react';
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

const MessageBubble = ({ message }) => {
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
        <p className="whitespace-pre-wrap">{message.content}</p>
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

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  // Handle Topic Selection/Change
  useEffect(() => {
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
          setShowAssessment(true);
          toast.success('AI Memory Coach has generated your session summary! 🎓');
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
            onClick={() => setActiveStage(1)}
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
            disabled
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-transparent text-dark-600 cursor-not-allowed"
            title="Stage 2 will unlock later"
          >
            <span>Stage 2: Practice & Recall</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-500 font-bold uppercase tracking-wider">Locked</span>
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
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
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
                <h4 className="text-sm font-semibold text-white">Revision Complete!</h4>
                <p className="text-xs text-dark-400">Save the session notes to record your spaced repetition score.</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => setShowAssessment(true)}
              className="w-full sm:w-auto"
            >
              Complete & Save
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
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
