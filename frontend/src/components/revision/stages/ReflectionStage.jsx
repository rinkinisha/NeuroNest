import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../../ui/Button';

const ReflectionStage = ({ onFinish }) => {
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
        <p className="text-dark-400 text-sm">Great job pushing through the revision.</p>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="text-lg font-semibold text-white mb-6 border-b border-dark-700/50 pb-4">
          Today's Summary
        </h3>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-dark-100">You remembered Arrays.</p>
              <p className="text-xs text-dark-500">Perfect recall on the wake-up stage.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-dark-100">You improved in Closures.</p>
              <p className="text-xs text-dark-500">Took one hint, but you grasped the core concept.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-dark-100">You're still confusing 'let' and 'var'.</p>
              <p className="text-xs text-dark-500">We'll schedule a visual diagram for this tomorrow.</p>
            </div>
          </div>
        </div>

        <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center mb-8">
          <Sparkles className="text-primary-400 mx-auto mb-2" size={20} />
          <p className="text-sm text-primary-300 font-medium">Tomorrow we'll focus on Scope.</p>
          <p className="text-xs text-primary-400/70 mt-1">Good luck! 🚀</p>
        </div>

        <Button variant="primary" className="w-full" onClick={onFinish}>
          Return to Dashboard
        </Button>
      </div>
    </motion.div>
  );
};

export default ReflectionStage;
