import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Check, X, Loader2 } from 'lucide-react';
import Button from '../../ui/Button';
import ConfidenceMeter from '../shared/ConfidenceMeter';
import QuestionCinematic from '../shared/QuestionCinematic';
import { generateStageQuestion, evaluateAnswer } from '../../../api/gemini';

const WakeUpStage = ({ onComplete, apiKey, topic }) => {
  const [confidence, setConfidence] = useState(null);
  const [cinematicDone, setCinematicDone] = useState(false);
  
  const [dynamicQuestion, setDynamicQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // For MCQ
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // For Input based (riddle, fill_in_blank)
  const [inputValue, setInputValue] = useState('');
  const [submittedInput, setSubmittedInput] = useState(false);
  
  // Evaluation Result
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const data = await generateStageQuestion(apiKey, topic, 'wakeup');
        setDynamicQuestion(data);
      } catch (error) {
        console.error("Failed to load Gemini warmup", error);
        setDynamicQuestion({
          type: 'mcq',
          question: "What is the output of the following JavaScript code? console.log(typeof [])",
          options: ['Object', 'Array', 'String', 'Number'],
          answer: 'Object'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [apiKey, topic]);

  const handleMcqAnswer = (option) => {
    setSelectedAnswer(option);
    if (option.toLowerCase().trim() === dynamicQuestion.answer.toLowerCase().trim()) {
      setIsCorrect(true);
      setFeedback("Correct! Great job.");
    } else {
      setIsCorrect(false);
      setFeedback(`Oops, the correct answer was: ${dynamicQuestion.answer}`);
    }
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSubmittedInput(true);
    setEvaluating(true);
    
    // Evaluate via Gemini
    try {
      const result = await evaluateAnswer(apiKey, dynamicQuestion.question, inputValue);
      setIsCorrect(result.isCorrect);
      setFeedback(result.feedback);
    } catch (error) {
      // Fallback
      setIsCorrect(true);
      setFeedback("Network error, but we'll accept that answer!");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-amber-500 gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="animate-pulse">Gemini is brewing a unique warmup challenge...</p>
        <img 
          src="/ninja.gif" 
          alt="Loading animation" 
          className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] mt-2"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4"
      >
      {/* Stage header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 shadow-glow-sm">
          <Zap size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Wake Up Your Brain</h2>
        <p className="text-dark-400 text-sm mt-1 capitalize">{dynamicQuestion.type.replace(/_/g, ' ')} format</p>
      </div>

      {/* Cinematic question reveal */}
      {!confidence ? (
        <div className="glass-card p-6">
          <p className="text-dark-300 text-sm text-center mb-4">Before we begin — how confident are you?</p>
          <ConfidenceMeter onSelect={setConfidence} />
        </div>
      ) : (
        <>
          <QuestionCinematic
            question={dynamicQuestion.question}
            subtext="Warmup"
            accentColor="amber"
            onReady={() => setCinematicDone(true)}
          />

          {/* Answers appear after cinematic finishes */}
          {cinematicDone && (
            <motion.div
              className="glass-card p-6 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* MCQ Format */}
              {dynamicQuestion.type === 'mcq' && (
                <>
                  {dynamicQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isRight = option.toLowerCase().trim() === dynamicQuestion.answer.toLowerCase().trim();
                    let cls = "w-full text-left px-5 py-4 rounded-xl border transition-all text-sm font-medium ";
                    if (!selectedAnswer) cls += "bg-dark-800/60 border-dark-700/40 hover:border-amber-500/50 hover:bg-dark-700/60 text-dark-200";
                    else if (isRight) cls += "bg-green-500/20 border-green-500/50 text-green-400";
                    else if (isSelected) cls += "bg-red-500/20 border-red-500/50 text-red-400";
                    else cls += "bg-dark-800/20 border-dark-700/20 text-dark-600 opacity-50";

                    return (
                      <button key={option} disabled={!!selectedAnswer} onClick={() => handleMcqAnswer(option)} className={cls}>
                        <div className="flex justify-between items-center">
                          {option}
                          {selectedAnswer && isRight && <Check size={18} className="text-green-400" />}
                          {selectedAnswer && isSelected && !isRight && <X size={18} className="text-red-400" />}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Input Format (Riddle / Fill in blank) */}
              {(dynamicQuestion.type === 'riddle' || dynamicQuestion.type === 'fill_in_blank') && (
                <form onSubmit={handleInputSubmit} className="space-y-4">
                  {!submittedInput ? (
                    <>
                      <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Your answer..."
                        className="input-field w-full py-4 px-5 text-sm"
                        autoFocus
                      />
                      <Button type="submit" variant="primary" className="w-full text-sm" disabled={!inputValue.trim()}>Submit Answer</Button>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <p className="text-xs text-dark-500 mb-1">Your Answer:</p>
                      <p className="text-sm text-dark-200">{inputValue}</p>
                    </div>
                  )}
                </form>
              )}

              {/* Evaluation Result */}
              {(selectedAnswer || submittedInput) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t border-dark-700/50 flex items-center justify-between"
                >
                  {evaluating ? (
                    <div className="flex items-center gap-2 text-primary-400 text-sm">
                      <Loader2 size={16} className="animate-spin" /> Evaluating with AI...
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 pr-4">
                        <p className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {isCorrect ? 'Correct! 🎉' : 'Oops, not quite!'}
                        </p>
                        <p className="text-xs text-dark-400 mt-1">{feedback}</p>
                      </div>
                      <Button variant="primary" onClick={onComplete} className="shadow-glow-sm shrink-0">Next Stage</Button>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </>
      )}
      </motion.div>
    </div>
  );
};

export default WakeUpStage;
