import { useState } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

const ConfidenceMeter = ({ onSelect }) => {
  return (
    <div className="mt-6 border-t border-dark-700/50 pt-4 animate-slide-up">
      <p className="text-sm text-dark-300 font-medium mb-3 text-center">
        Before you answer, how confident are you?
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => onSelect('high')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"
        >
          <Smile size={18} /> Very
        </button>
        <button
          onClick={() => onSelect('medium')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
        >
          <Meh size={18} /> Somewhat
        </button>
        <button
          onClick={() => onSelect('low')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
        >
          <Frown size={18} /> Not
        </button>
      </div>
    </div>
  );
};

export default ConfidenceMeter;
