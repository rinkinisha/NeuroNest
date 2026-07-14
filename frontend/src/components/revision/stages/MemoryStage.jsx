import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';
import QuestionCinematic from '../shared/QuestionCinematic';
import SpeechToTextButton from '../shared/SpeechToTextButton';
import { generateStageQuestion, evaluateAnswer } from '../../../api/gemini';

const MemoryStage = ({ onComplete, apiKey, topic }) => {
  const [cinematicDone, setCinematicDone] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Evaluation state
  const [evaluating, setEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await generateStageQuestion(apiKey, topic, 'memory');
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        } else {
          throw new Error("Expected array of questions");
        }
      } catch (error) {
        console.error("Failed to load Gemini memory questions", error);
        // Fallback array of 5
        setQuestions(Array(5).fill({
          question: "What is the primary function of this concept?",
          hints: ["Hint 1", "Hint 2", "Hint 3", "Answer"]
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [apiKey, topic]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-purple-400 gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="animate-pulse">Gemini is generating 5 deep-recall questions...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleTranscript = (text) => {
    setAnswer(prev => (prev ? prev + ' ' + text : text));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    setSubmitted(true);
    setEvaluating(true);
    
    try {
      const result = await evaluateAnswer(apiKey, currentQ.question, answer);
      setIsCorrect(result.isCorrect); // gemini logic uses >=40 score for this
      setFeedback(result.feedback);
    } catch (err) {
      setIsCorrect(true);
      setFeedback("Network error evaluating, but we will accept this answer!");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      // Move to next question
      setCurrentIndex(prev => prev + 1);
      setAnswer('');
      setSubmitted(false);
      setHintLevel(0);
      setCinematicDone(false);
      setIsCorrect(false);
      setFeedback('');
    } else {
      // Finished all 5
      onComplete();
    }
  };

  return (
    <motion.div
      key={`question-${currentIndex}`} // Force re-render of cinematic when index changes
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4"
    >
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mb-3">
          <Brain size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Memory Challenge</h2>
        <p className="text-dark-400 text-sm mt-1">Question {currentIndex + 1} of {questions.length} • Pure recall</p>
      </div>

      {/* Cinematic intro */}
      <QuestionCinematic
        question={currentQ.question}
        subtext={`Recall ${currentIndex + 1}/${questions.length}`}
        accentColor="purple"
        onReady={() => setCinematicDone(true)}
      />

      {/* Answer area after cinematic */}
      {cinematicDone && (
        <motion.div
          className="glass-card p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type or speak your explanation..."
                  rows={4}
                  disabled={evaluating || isCorrect}
                  className={`input-field resize-none pr-14 ${isListening ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''} ${(evaluating || isCorrect) ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <div className="absolute right-2 bottom-3">
                  <SpeechToTextButton 
                    onTranscript={handleTranscript} 
                    isListening={isListening} 
                    setIsListening={setIsListening} 
                  />
                </div>
              </div>
              {!isCorrect && (
                <Button type="submit" variant="primary" className="w-full" disabled={!answer.trim() && !isListening || evaluating}>
                  {evaluating ? 'Grading...' : submitted ? 'Try Again' : 'Submit Answer'}
                </Button>
              )}
            </form>

            {submitted && (
              <div className="space-y-6">
                {evaluating ? (
                  <div className="flex flex-col items-center justify-center py-6 text-purple-400 gap-3">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="text-sm">AI is grading your context...</p>
                  </div>
                ) : (
                  <div className="text-center border-t border-dark-700/50 pt-6">
                    <h3 className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Contextually Correct! 🎉' : 'Needs Improvement'}
                    </h3>
                    <p className="text-sm text-dark-300 mb-6 max-w-md mx-auto">{feedback}</p>
                    
                    {isCorrect ? (
                      <Button variant="primary" onClick={handleNext} className="w-full max-w-xs" icon={ArrowRight}>
                        {currentIndex === questions.length - 1 ? "Finish Stage" : "Next Question"}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {hintLevel < currentQ.hints.length && (
                          <Button variant="danger" onClick={() => setHintLevel(p => p + 1)}>
                            {hintLevel === 0 ? 'I need a hint' : 'Give me another hint'}
                          </Button>
                        )}

                        <AnimatePresence>
                          {hintLevel > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 text-left">
                              {currentQ.hints.slice(0, hintLevel).map((h, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                  className={`p-3 rounded-xl border text-sm ${i === currentQ.hints.length - 1 ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-dark-800 border-dark-700 text-dark-300'}`}>
                                  {h}
                                </motion.div>
                              ))}
                              
                              {/* If they exhausted all hints, they can move on without answering */}
                              {hintLevel === currentQ.hints.length && (
                                <div className="flex justify-center mt-4">
                                  <Button variant="outline" onClick={handleNext}>Skip Question</Button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MemoryStage;
