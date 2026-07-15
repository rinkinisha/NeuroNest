import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, BookOpen, ChevronDown, Key } from 'lucide-react';
import API from '../api/axios';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import { useReflection } from '../context/ReflectionContext';
import AIChat from '../components/revision/AIChat';
import WakeUpStage from '../components/revision/stages/WakeUpStage';
import MemoryStage from '../components/revision/stages/MemoryStage';
import ConnectDotsStage from '../components/revision/stages/ConnectDotsStage';
import MissionStage from '../components/revision/stages/MissionStage';
import BossBattleStage from '../components/revision/stages/BossBattleStage';
import ReflectionStage from '../components/revision/stages/ReflectionStage';
import AIAvatar from '../components/revision/shared/AIAvatar';
import toast from 'react-hot-toast';

const DEFAULT_JS_TOPICS = [
  { _id: 'js-closures', title: 'Closures & Scope', subject: 'JavaScript', tags: ['js', 'scope'] },
  { _id: 'js-promises', title: 'Promises & Async/Await', subject: 'JavaScript', tags: ['js', 'async'] },
  { _id: 'js-prototypes', title: 'Prototypes & Inheritance', subject: 'JavaScript', tags: ['js', 'oop'] },
  { _id: 'react-hooks', title: 'React Hooks (useState & useEffect)', subject: 'React', tags: ['react', 'js'] }
];

const STAGES = [
  'intro',
  'wakeup',
  'memory',
  'conversation',
  'connect_dots',
  'mission',
  'boss_battle',
  'reflection'
];

const STAGE_LABELS = {
  wakeup: 'Warmup',
  memory: 'Memory',
  conversation: 'AI Coach',
  connect_dots: 'Connect Dots',
  mission: 'Mission',
  boss_battle: 'Boss Battle',
  reflection: 'Reflection'
};

const AIRevision = () => {
  const navigate = useNavigate();
  const { fetchReflections } = useReflection();
  const [topics, setTopics] = useState([]);
  
  // Restore topic from localStorage if available
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const saved = localStorage.getItem('neuronest_revision_selected_topic');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loadingTopics, setLoadingTopics] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('neuronest_gemini_key') || '');
  const [tempKey, setTempKey] = useState(apiKey);

  // Journey State (Restore stage index from localStorage if available)
  const [stageIndex, setStageIndex] = useState(() => {
    const saved = localStorage.getItem('neuronest_revision_stage_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const currentStage = STAGES[stageIndex];

  useEffect(() => {
    // Load API Key from local storage
    const storedKey = localStorage.getItem('neuronest_gemini_key') || localStorage.getItem('gemini_api_key');
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
          setSelectedTopic(prev => prev || extractedTopicsList[0]);
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
          setSelectedTopic(prev => prev || fetchedTopics[0]);
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
      localStorage.setItem('neuronest_gemini_key', tempKey.trim());
      setApiKey(tempKey.trim());
      toast.success('Gemini API Key saved successfully! 🚀');
    } else {
      toast.error('Please enter a valid API Key');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('neuronest_gemini_key');
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempKey('');
  };

  const startJourney = () => {
    setStageIndex(1);
    localStorage.setItem('neuronest_revision_stage_index', '1');
    localStorage.setItem('neuronest_revision_selected_topic', JSON.stringify(selectedTopic));
  };

  const handleNextStage = () => {
    if (stageIndex < STAGES.length - 1) {
      const nextIndex = stageIndex + 1;
      setStageIndex(nextIndex);
      localStorage.setItem('neuronest_revision_stage_index', nextIndex.toString());
    } else {
      handleFinish();
    }
  };

  const clearRevisionProgress = () => {
    localStorage.removeItem('neuronest_revision_stage_index');
    localStorage.removeItem('neuronest_revision_selected_topic');
  };

  const handleFinish = () => {
    clearRevisionProgress();
    navigate('/dashboard');
  };

  const handleQuit = () => {
    clearRevisionProgress();
    setStageIndex(0);
  };

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
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col gap-6 py-4 px-4 sm:px-6">

      {/* Top Bar & Progress Trackers */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {stageIndex > 0 ? (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handleQuit}
                className="text-dark-500 hover:text-white transition-colors text-sm font-semibold border border-dark-700/50 hover:border-red-500/30 px-3 py-1.5 rounded-xl bg-dark-900/20"
              >
                × Quit Journey
              </button>
              <div className="text-right">
                <span className="text-xs text-dark-400 font-bold uppercase tracking-wider">
                  Active Topic:
                </span>
                <span className="text-xs text-primary-400 font-bold ml-1.5">
                  {selectedTopic ? selectedTopic.title : 'General Revision'}
                </span>
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

          {/* Topic Selector (Only show on Intro screen) */}
          {stageIndex === 0 && (
            <div className="relative shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-700/40 hover:border-primary-500/30 text-dark-300 hover:text-white transition-all duration-200 text-sm min-w-[200px]"
              >
                <BookOpen size={15} className="text-primary-400" />
                <span className="flex-1 text-left truncate font-medium">
                  {selectedTopic ? selectedTopic.title : 'Select Topic'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-dark-800 border border-dark-700/60 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { setSelectedTopic(null); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTopic ? 'bg-primary-500/20 text-primary-300' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'}`}
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
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTopic?._id === topic._id ? 'bg-primary-500/20 text-primary-300' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'}`}
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

        {/* Stepper (Shows active, completed, and locked stages) */}
        {stageIndex > 0 && (
          <div className="w-full flex items-center gap-2 overflow-x-auto py-2 border-b border-dark-800 scrollbar-none">
            {STAGES.slice(1).map((stage, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < stageIndex;
              const isActive = stepNum === stageIndex;

              return (
                <div key={stage} className="flex items-center gap-2 shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500/10 border-primary-500 text-primary-300 shadow-glow-sm'
                      : isCompleted
                      ? 'bg-green-500/10 border-green-500/40 text-green-400'
                      : 'bg-dark-900/40 border-dark-850 text-dark-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-primary-400 animate-pulse' : isCompleted ? 'bg-green-400' : 'bg-dark-700'
                    }`} />
                    {STAGE_LABELS[stage]}
                  </div>
                  {stepNum < STAGES.length - 1 && (
                    <span className="text-dark-800 text-xs font-bold">➔</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area with Sliding Animations */}
      <div className="flex-1 relative flex flex-col justify-center">
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
              {/* Character Background/Header */}
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
              <p className="text-dark-300 max-w-md mx-auto mb-6 leading-relaxed relative z-10 text-sm md:text-base">
                This isn't a boring quiz. We'll start with a quick warmup, move to deep recall, challenge an AI Mentor, connect the dots, write code on a mission, and face a Boss Battle.
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
                      <Button type="submit" variant="primary" disabled={tempKey.trim().length < 10}>Save</Button>
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

                <div className="border-t border-dark-700/50 my-3" />
                
                <div className="text-[10px] font-bold text-dark-500 px-3 py-1 uppercase tracking-wider text-left">
                  JavaScript Presets
                </div>
                <div className="grid grid-cols-1 gap-1 text-left">
                  {DEFAULT_JS_TOPICS.map((topic) => (
                    <button
                      key={topic._id}
                      onClick={() => { setSelectedTopic(topic); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTopic?._id === topic._id ? 'bg-primary-500/20 text-primary-300' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white'}`}
                    >
                      <div className="font-medium truncate">{topic.title}</div>
                      <div className="text-xs text-dark-500">{topic.subject}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="xl"
                onClick={startJourney}
                disabled={!apiKey}
                className="w-full max-w-xs shadow-glow-sm relative z-10"
              >
                Start Journey
              </Button>
            </motion.div>
          )}

          {/* Wake Up Stage */}
          {currentStage === 'wakeup' && (
            <motion.div
              key="wakeup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <WakeUpStage onComplete={handleNextStage} apiKey={apiKey} topic={selectedTopic} />
            </motion.div>
          )}

          {/* Memory Challenge Stage */}
          {currentStage === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <MemoryStage onComplete={handleNextStage} apiKey={apiKey} topic={selectedTopic} />
            </motion.div>
          )}

          {/* AI Conversation Stage */}
          {currentStage === 'conversation' && (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col glass-card overflow-hidden min-h-[500px]"
            >
              <AIChat topic={selectedTopic} apiKey={apiKey} onComplete={handleNextStage} />
            </motion.div>
          )}

          {/* Connect the Dots Stage */}
          {currentStage === 'connect_dots' && (
            <motion.div
              key="connect_dots"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <ConnectDotsStage onComplete={handleNextStage} apiKey={apiKey} topic={selectedTopic} />
            </motion.div>
          )}

          {/* Coding Mission Stage */}
          {currentStage === 'mission' && (
            <motion.div
              key="mission"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <MissionStage onComplete={handleNextStage} topic={selectedTopic} />
            </motion.div>
          )}

          {/* Boss Battle Stage */}
          {currentStage === 'boss_battle' && (
            <motion.div
              key="boss_battle"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <BossBattleStage onComplete={handleNextStage} topic={selectedTopic} />
            </motion.div>
          )}

          {/* Reflection Stage */}
          {currentStage === 'reflection' && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <ReflectionStage onFinish={handleFinish} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIRevision;
