import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Sparkles, Loader2, BookOpen } from 'lucide-react';
import Button from '../../ui/Button';
import API from '../../../api/axios';

const ReflectionStage = ({ onFinish }) => {
  const [content, setContent] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please share at least a short reflection on today\'s session.');
      return;
    }

    setLoading(true);
    setError('');

    // Parse comma-separated list into clean array
    const topicsToRevise = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await API.post('/reflections', {
        content: content.trim(),
        topicsToRevise,
        goal: goal.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onFinish();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit reflection:', err);
      setError('Could not save your reflection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4"
    >
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-4 shadow-glow-md">
          <Target size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-dark-400 text-sm">Reflect on your progress and set your next goals.</p>
      </div>

      <div className="glass-card p-6 md:p-8">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shadow-glow-sm"
            >
              <CheckCircle2 size={36} />
            </motion.div>
            <h3 className="text-xl font-bold text-white">Reflection Saved!</h3>
            <p className="text-dark-400 text-sm max-w-sm">
              Your topics and goals have been saved successfully. Returning to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-dark-700/50 pb-4 flex items-center gap-2">
              <Sparkles className="text-green-400" size={18} />
              Daily Reflection & Goal Setting
            </h3>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Reflection Content */}
            <div className="flex flex-col gap-2">
              <label htmlFor="reflection" className="text-sm font-semibold text-dark-200">
                1. What did you learn or struggle with today? *
              </label>
              <textarea
                id="reflection"
                placeholder="Today I practiced JS Closures. I understand lexical scope better but still struggle with private variables..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field w-full py-3 px-4 text-sm"
                required
              />
            </div>

            {/* Topics to Revise */}
            <div className="flex flex-col gap-2">
              <label htmlFor="topics" className="text-sm font-semibold text-dark-200 flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary-400" />
                2. Which topics do you want to revise in future journeys?
              </label>
              <input
                id="topics"
                type="text"
                placeholder="e.g. Closures, Callbacks, Async Await (comma separated)"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                className="input-field w-full py-3 px-4 text-sm"
              />
              <p className="text-xs text-dark-500">
                These topics will appear in your next AI Revision selection dropdown.
              </p>
            </div>

            {/* Goal for tomorrow */}
            <div className="flex flex-col gap-2">
              <label htmlFor="goal" className="text-sm font-semibold text-dark-200">
                3. What is your learning goal for tomorrow?
              </label>
              <input
                id="goal"
                type="text"
                placeholder="e.g. Complete 3 challenges on scope & lexical environment"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="input-field w-full py-3 px-4 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full shadow-glow-sm"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  'Submit & Finish Session'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default ReflectionStage;
