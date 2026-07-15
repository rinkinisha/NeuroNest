/**
 * components/battle/QuestionCard.jsx
 * Renders a Boss Battle question based on its type:
 * - MCQ: radio button options (A/B/C/D)
 * - output: text input for predicted output
 * - fill: text input for missing code
 * - debug: text input for the bug fix
 */

import { useState } from 'react';
import { Code2, HelpCircle, FileCode, Bug } from 'lucide-react';

const typeConfig = {
  mcq:    { label: 'Multiple Choice',   icon: HelpCircle, color: 'text-primary-400',  bg: 'bg-primary-500/10 border-primary-500/20'   },
  output: { label: 'Predict Output',    icon: Code2,      color: 'text-primary-400',  bg: 'bg-primary-500/10 border-primary-500/20' },
  fill:   { label: 'Fill in the Blank', icon: FileCode,   color: 'text-primary-400',  bg: 'bg-primary-500/10 border-primary-500/20'    },
  debug:  { label: 'Find the Bug',      icon: Bug,        color: 'text-primary-400',  bg: 'bg-primary-500/10 border-primary-500/20'      },
};

const QuestionCard = ({ question, questionNumber, total, onSubmit, disabled }) => {
  const [selected, setSelected] = useState('');
  const cfg = typeConfig[question.type] || typeConfig.mcq;
  const Icon = cfg.icon;

  const handleSubmit = () => {
    if (!selected.trim()) return;
    onSubmit(selected.trim());
    setSelected('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          <Icon size={13} />
          {cfg.label}
        </div>
        <span className="text-xs text-dark-500 tabular-nums">
          {questionNumber} / {total}
        </span>
      </div>

      {/* Question Text */}
      <div className="text-dark-100 text-base leading-relaxed font-medium whitespace-pre-wrap">
        {question.question}
      </div>

      {/* Answer Input — varies by type */}
      {question.type === 'mcq' ? (
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <button
              key={i}
              disabled={disabled}
              onClick={() => setSelected(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm
                ${selected === opt
                  ? 'bg-primary-500/25 border-primary-500/60 text-white'
                  : 'bg-dark-800/50 border-dark-700/40 text-dark-200 hover:border-primary-500/30 hover:text-white'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={question.type === 'debug' ? 4 : 2}
          placeholder={
            question.type === 'fill'   ? 'Type the missing code...' :
            question.type === 'output' ? 'Type the exact output...' :
            'Describe or fix the bug...'
          }
          className="input-field text-sm font-mono resize-none"
        />
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selected.trim() || disabled}
        className="btn-primary w-full"
      >
        Submit Answer
      </button>
    </div>
  );
};

export default QuestionCard;
