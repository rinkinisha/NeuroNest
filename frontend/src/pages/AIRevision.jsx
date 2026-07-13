/**
 * pages/AIRevision.jsx
 * AI Revision page with topic selector and chat interface (frontend only).
 */

import { useState, useEffect } from 'react';
import { Bot, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import API from '../api/axios';
import AIChat from '../components/revision/AIChat';
import Loader from '../components/ui/Loader';

const AIRevision = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Integration Notice Banner */}
      <div className="shrink-0 flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-primary-600/10 to-violet-600/10 border border-primary-500/20">
        <Sparkles size={18} className="text-primary-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-300">Gemini AI Integration Ready</p>
          <p className="text-xs text-dark-400 mt-0.5">
            This interface is fully built and ready. Add your Gemini API key to{' '}
            <code className="text-primary-400 bg-primary-500/10 px-1 py-0.5 rounded text-xs">backend/.env</code>{' '}
            and connect the <code className="text-primary-400 bg-primary-500/10 px-1 py-0.5 rounded text-xs">GEMINI_API_KEY</code> to enable real AI responses.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-card flex-1 overflow-hidden flex flex-col min-h-[500px]">
        <AIChat key={selectedTopic?._id || 'general'} topic={selectedTopic} />
      </div>
    </div>
  );
};

export default AIRevision;
