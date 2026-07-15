import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, BookOpen, ChevronDown, Rocket, Key } from 'lucide-react';
import API from '../api/axios';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import { useReflection } from '../context/ReflectionContext';

import WakeUpStage from '../components/revision/stages/WakeUpStage';
import MemoryStage from '../components/revision/stages/MemoryStage';
import AIAvatar from '../components/revision/shared/AIAvatar';

const STAGES = [
  'intro',
  'wakeup',
  'memory'
];

const AIRevision = () => {
  const navigate = useNavigate();
  const { fetchReflections } = useReflection();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Gemini API Key State
  const [apiKey, setApiKey] = useState('');
  const [tempKey, setTempKey] = useState('');

  // Journey State
  const [stageIndex, setStageIndex] = useState(0);
  const currentStage = STAGES[stageIndex];

  useEffect(() => {
    // Load API Key from local storage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setTempKey(storedKey);
    }

    const fetchRevisionTopics = async () => {
      try {
        // Fetch reflection data via context
        const reflections = await fetchReflections();

        // Extract unique topics from all reflections
        const extractedTopicsSet = new Set();
        reflections.forEach(ref => {
          if (ref.topicsToRevise && Array.isArray(ref.topicsToRevise)) {
            ref.topicsToRevise.forEach(topic => {
              if (topic && topic.trim()) {
                extractedTopicsSet.add(topic.trim());
              }
            });
          }
        });

        const extractedTopicsList = Array.from(extractedTopicsSet).map((topicName, index) => ({
          _id: `refl-${index}`,
          title: topicName,
          subject: 'From Reflection'
        }));

        if (extractedTopicsList.length > 0) {
          setTopics(extractedTopicsList);
          setSelectedTopic(extractedTopicsList[0]);
          setLoadingTopics(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load reflections, falling back to general topics:", err);
      }

      // Fallback: Fetch general topics if no reflection topics exist or if the request fails
      try {
        const { data: topicsData } = await API.get('/topics');
        const fetchedTopics = topicsData.data || [];
        setTopics(fetchedTopics);
        if (fetchedTopics.length > 0) {
          setSelectedTopic(fetchedTopics[0]);
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchRevisionTopics();
  }, []);

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (tempKey.trim().length > 10) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempKey('');
  };

  const handleNextStage = () => {
    if (stageIndex < STAGES.length - 1) {
      setStageIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  // Progress Bar
  const progressPercent = ((stageIndex) / (STAGES.length - 1)) * 100;

  const [showVideo, setShowVideo] = useState(() => !sessionStorage.getItem('ai_intro_played_v2'));

  const handleVideoEnd = () => {
    sessionStorage.setItem('ai_intro_played_v2', 'true');
    setShowVideo(false);
  };

  if (showVideo) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <video
          src="/intro-video.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="w-full h-full object-contain max-w-full max-h-screen"
        />
        <button
          onClick={handleVideoEnd}
          className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm z-[110] transition-colors"
        >
          Skip
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col gap-6 py-4">

      {/* Top Bar (Progress & Topic Selector) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">

        {/* Progress Bar (Only show if started) */}
        {stageIndex > 0 ? (
          <div className="flex-1 max-w-md flex items-center gap-4">
            <button
              onClick={() => setStageIndex(0)}
              className="text-dark-500 hover:text-white transition-colors"
            >
              × Quit
            </button>
            <div className="flex-1 h-3 bg-dark-800 rounded-full overflow-hidden border border-dark-700/50">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="text-primary-400" size={24} />
              AI Revision Journey
            </h1>
          </div>
        )}

        {/* Topic Selector */}
        {stageIndex === 0 && (
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTopic ? 'bg-primary-500/20 text-primary-300' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'
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
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTopic?._id === topic._id
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
        )}
      </div>

      {/* Main Content Area with Sliding Animations */}
      <div className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">

          {/* Intro Screen */}
          {currentStage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-6 relative"
            >
              {/* 3D Character Background/Header */}
              <div className="w-full max-w-lg h-64 md:h-80 mb-4 relative z-0">
                <AIAvatar className="w-full h-full" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute top-4 right-10 bg-dark-800/80 backdrop-blur-md border border-primary-500/30 px-4 py-2 rounded-2xl rounded-bl-sm shadow-glow-sm hidden md:block"
                >
                  <p className="text-xs text-primary-200 font-medium">Hello there! Ready?</p>
                </motion.div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
                Ready to level up?
              </h2>
              <p className="text-dark-300 max-w-md mx-auto mb-6 leading-relaxed relative z-10">
                This isn't a boring quiz. We'll start with a quick warmup, move to deep recall, challenge an AI Mentor, connect the dots, and face a Boss Battle.
              </p>

              {/* API Key Configuration */}
              <div className="w-full max-w-sm mx-auto mb-10 z-10 relative">
                {!apiKey ? (
                  <form onSubmit={handleSaveKey} className="glass-card p-4 flex flex-col gap-3 text-left">
                    <label className="text-sm font-medium text-primary-300 flex items-center gap-2">
                      <Key size={16} /> Gemini API Key Required
                    </label>
                    <p className="text-xs text-dark-400">Questions are generated dynamically! Your key is stored securely in your browser.</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        className="input-field flex-1 text-sm py-2"
                      />
                      <Button type="submit" variant="primary" disabled={tempKey.length < 10}>Save</Button>
                    </div>
                  </form>
                ) : (
                  <div className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <Key size={16} /> API Key Configured
                    </div>
                    <button onClick={handleClearKey} className="text-xs text-dark-400 hover:text-red-400 transition-colors">
                      Clear Key
                    </button>
                  </div>
                )}
              </div>

              <Button
                size="xl"
                onClick={handleNextStage}
                disabled={!apiKey}
                className="w-full max-w-xs shadow-glow-sm relative z-10"
              >
                Start Journey
              </Button>
            </motion.div>
          )}

          {/* Wake Up Stage */}
          {currentStage === 'wakeup' && (
            <WakeUpStage key="wakeup" onComplete={handleNextStage} apiKey={apiKey} topic={selectedTopic} />
          )}

          {/* Memory Challenge Stage */}
          {currentStage === 'memory' && (
            <MemoryStage key="memory" onComplete={handleNextStage} apiKey={apiKey} topic={selectedTopic} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIRevision;
