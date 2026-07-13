/**
 * components/revision/AIChat.jsx
 * Frontend-only AI chat interface with typing animation.
 * Ready for Gemini API integration.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

// Placeholder responses for demo (will be replaced by Gemini API)
const DEMO_RESPONSES = [
  "That's a great question! Let me think about this topic with you. Can you tell me more about what specifically you'd like to revise?",
  "Excellent! Based on what I know about this topic, let me help break it down into key concepts you should remember...",
  "I can see you're working hard on this revision. Let's test your understanding with a quick question about the core principles.",
  "Very insightful! The key thing to remember here is the underlying principle. Let me explain it from a different angle...",
  "Great effort! You're making excellent progress. Here's a memory technique that might help you retain this information better...",
];

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
          ? 'bg-gradient-to-br from-primary-600 to-violet-600'
          : 'bg-primary-600/20 border border-primary-500/20'
      }`}>
        {isUser
          ? <User size={15} className="text-white" />
          : <Bot size={15} className="text-primary-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
        isUser ? 'chat-bubble-user' : 'chat-bubble-ai'
      }`}>
        {message.content}
        <div className={`text-xs mt-1 ${isUser ? 'text-primary-200' : 'text-dark-600'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const AIChat = ({ topic = null }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: topic
        ? `Hello! I'm your AI revision assistant. I'm ready to help you revise **${topic.title}**. What would you like to explore or test yourself on?`
        : "Hello! I'm your AI revision assistant powered by Gemini. Select a topic and let's start your revision session! I can quiz you, explain concepts, or help you recall key information.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay (replace with actual Gemini API call)
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: topic
          ? `Ready to start fresh! Let's revise **${topic.title}** again. What do you want to focus on?`
          : "Chat cleared. Let's start a new revision session!",
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    'Quiz me on key concepts',
    'Explain the main points',
    'Give me a memory trick',
    'What should I focus on?',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-glow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Revision Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-dark-500">Gemini AI • Ready</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg text-dark-500 hover:text-dark-300 hover:bg-dark-700/60 transition-colors"
          title="Clear chat"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-dark-800/60 border border-dark-700/40 text-dark-400 hover:text-primary-300 hover:border-primary-500/30 transition-all duration-200"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-700/50 shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your topic... (Enter to send)"
            rows={1}
            className="input-field flex-1 resize-none min-h-[44px] max-h-32 py-3"
            style={{ lineHeight: '1.4' }}
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-3 shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-dark-600 mt-2 text-center">
          🔮 Gemini API integration slot ready – connect your API key to enable full AI features
        </p>
      </div>
    </div>
  );
};

export default AIChat;
