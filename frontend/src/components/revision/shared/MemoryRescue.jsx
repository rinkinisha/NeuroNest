import { BrainCircuit, Image, Lightbulb, PlaySquare } from 'lucide-react';
import Button from '../../ui/Button';

const MemoryRescue = ({ onContinue }) => {
  return (
    <div className="absolute inset-0 z-10 bg-dark-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-lg w-full glass-card p-8 text-center animate-slide-up border-primary-500/30">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-glow-md">
          <BrainCircuit size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Memory Rescue Initiated</h2>
        <p className="text-dark-300 text-sm mb-6">
          It looks like you're struggling with this concept. Let's try a different approach!
          Instead of just asking again, here is a new way to look at it:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/40 cursor-pointer hover:border-primary-500/40 transition-colors">
            <Lightbulb size={18} className="text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-white">Real-life Analogy</p>
            <p className="text-xs text-dark-500 mt-1">Like folders in a filing cabinet...</p>
          </div>
          <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/40 cursor-pointer hover:border-primary-500/40 transition-colors">
            <Image size={18} className="text-primary-400 mb-2" />
            <p className="text-sm font-semibold text-white">Visual Diagram</p>
            <p className="text-xs text-dark-500 mt-1">See how the data flows...</p>
          </div>
        </div>

        <Button variant="primary" className="w-full" onClick={onContinue}>
          Got it! Let's continue
        </Button>
      </div>
    </div>
  );
};

export default MemoryRescue;
