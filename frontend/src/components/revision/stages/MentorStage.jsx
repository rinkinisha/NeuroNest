import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Send, MessagesSquare, Code } from 'lucide-react';
import Button from '../../ui/Button';

const MentorStage = ({ onComplete }) => {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Persona: Senior Developer. Topic: Event Delegation.' },
    { role: 'assistant', content: 'Alright junior, let\'s talk about Event Delegation. Explain it to me simply.' }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    // Simulate AI mentor interruption
    setTimeout(() => {
      if (step === 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'But why can\'t we simply attach listeners everywhere? Isn\'t it easier to just do `element.addEventListener` on everything?' 
        }]);
        setStep(1);
      } else if (step === 1) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Exactly! Now, what if the elements are created dynamically after the page loads? How does event delegation solve that?' 
        }]);
        setStep(2);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Spot on. You\'ve got a solid grasp on this. Good job! 🚀' 
        }]);
        setStep(3);
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto h-full flex flex-col gap-4"
    >
      <div className="text-center mb-2 shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 mb-3">
          <MessagesSquare size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Mentor Conversation</h2>
        <p className="text-dark-400 text-sm mt-1">Defend your knowledge.</p>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[400px]">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            if (msg.role === 'system') {
              return (
                <div key={idx} className="flex justify-center">
                  <span className="px-3 py-1 bg-dark-800 rounded-full text-xs text-dark-500 border border-dark-700">
                    {msg.content}
                  </span>
                </div>
              );
            }
            
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-primary-600' : 'bg-blue-600/20 border border-blue-500/30'
                }`}>
                  {isUser ? <User size={15} /> : <Code size={15} className="text-blue-400" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                  isUser ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-dark-800 border border-dark-700 text-dark-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {step < 3 ? (
          <form onSubmit={handleSend} className="p-4 border-t border-dark-700/50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your explanation..."
              className="input-field flex-1"
              autoFocus
            />
            <Button type="submit" variant="primary" disabled={!input.trim()}>
              <Send size={16} />
            </Button>
          </form>
        ) : (
          <div className="p-4 border-t border-dark-700/50 flex justify-center bg-dark-800/30">
            <Button variant="success" onClick={onComplete}>
              Continue to Next Stage
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MentorStage;
