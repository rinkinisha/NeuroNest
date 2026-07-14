/**
 * pages/AIRevision.jsx
 * AI Revision page with topic selector and chat interface (frontend only).
 */

import { useState, useEffect } from 'react';
import { Bot, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import API from '../api/axios';
import AIChat from '../components/revision/AIChat';
import Loader from '../components/ui/Loader';
import toast from 'react-hot-toast';

const DEFAULT_JS_TOPICS = [
  { _id: 'js-closures', title: 'Closures & Scope', subject: 'JavaScript', tags: ['js', 'scope'] },
  { _id: 'js-promises', title: 'Promises & Async/Await', subject: 'JavaScript', tags: ['js', 'async'] },
  { _id: 'js-prototypes', title: 'Prototypes & Inheritance', subject: 'JavaScript', tags: ['js', 'oop'] },
  { _id: 'react-hooks', title: 'React Hooks (useState & useEffect)', subject: 'React', tags: ['react', 'js'] }
];

const AIRevision = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('neuronest_gemini_key') || '');
  const [keyInput, setKeyInput] = useState(apiKey);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await API.get('/topics');
        setTopics(data.data);
      } catch {
        // Non-critical
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-primary-400" size={24} />
            AI Revision Assistant
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Powered by Gemini AI – quiz yourself, get explanations, build memory
          </p>
        </div>

        {/* Topic Selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-700/40 hover:border-primary-500/30 text-dark-300 hover:text-white transition-all duration-200 text-sm min-w-44"
          >
            <BookOpen size={15} className="text-primary-400" />
            <span className="flex-1 text-left truncate">
              {selectedTopic ? selectedTopic.title : 'Select Topic'}
            </span>
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-dark-800 border border-dark-700/60 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { setSelectedTopic(null); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedTopic ? 'bg-primary-500/20 text-primary-300' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'
                  }`}
                >
                  General Revision
                </button>

                {loadingTopics ? (
                  <div className="flex justify-center py-4">
                    <Loader size="sm" />
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-center text-dark-500 text-xs py-4">No topics yet</p>
                ) : (
                  topics.map((topic) => (
                    <button
                      key={topic._id}
                      onClick={() => { setSelectedTopic(topic); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTopic?._id === topic._id
                          ? 'bg-primary-500/20 text-primary-300'
                          : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'
                      }`}
                    >
                      <div className="font-medium truncate">{topic.title}</div>
                      {topic.subject && (
                        <div className="text-xs text-dark-500">{topic.subject}</div>
                      )}
                    </button>
                  ))
                )}

                <div className="border-t border-dark-700/50 my-1" />
                <div className="text-[10px] font-bold text-dark-500 px-3 py-1 uppercase tracking-wider">
                  JavaScript Presets
                </div>
                {DEFAULT_JS_TOPICS.map((topic) => (
                  <button
                    key={topic._id}
                    onClick={() => { setSelectedTopic(topic); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTopic?._id === topic._id
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'
                    }`}
                  >
                    <div className="font-medium truncate">{topic.title}</div>
                    <div className="text-xs text-dark-500">{topic.subject}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Integration Notice Banner / Key Input */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-primary-600/10 to-violet-600/10 border border-primary-500/20 shadow-glow-sm">
        <div className="flex items-start gap-3 flex-1">
          <Sparkles size={18} className="text-primary-400 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary-300">Stage 1: AI Memory Coach is Active</p>
            <p className="text-xs text-dark-400">
              Your coach will randomly adopt a Senior Engineer, Interviewer, or Developer persona. Enter your Gemini API Key to unlock this feature.
            </p>
          </div>
        </div>

        {/* API Key Form */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          {apiKey ? (
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                API Key Active
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('neuronest_gemini_key');
                  setApiKey('');
                  setKeyInput('');
                }}
                className="text-xs text-primary-400 hover:text-primary-300 underline font-medium"
              >
                Change Key
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (keyInput.trim()) {
                  localStorage.setItem('neuronest_gemini_key', keyInput.trim());
                  setApiKey(keyInput.trim());
                  toast.success('Gemini API Key saved successfully! 🚀');
                } else {
                  toast.error('Please enter a valid API Key');
                }
              }}
              className="flex gap-2 w-full md:w-auto animate-fade-in"
            >
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste Gemini API Key..."
                className="input-field text-xs px-3 py-2 w-full md:w-56"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 rounded-xl text-xs font-semibold text-white shadow-glow-sm transition-all duration-200"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-card flex-1 overflow-hidden flex flex-col min-h-[500px]">
        <AIChat key={selectedTopic?._id || 'general'} topic={selectedTopic} apiKey={apiKey} />
      </div>
    </div>
  );
};

export default AIRevision;
