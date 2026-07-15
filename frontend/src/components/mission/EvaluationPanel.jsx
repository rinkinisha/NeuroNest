/**
 * components/mission/EvaluationPanel.jsx
 * Displays Gemini code evaluation results: scores, strengths, weaknesses, feedback.
 */

import { CheckCircle2, XCircle, MessageSquare, TrendingUp } from 'lucide-react';

const ScoreBar = ({ label, score, max, color }) => {
  const pct = Math.round((score / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-dark-300">{label}</span>
        <span className="font-semibold text-white">{score}/{max}</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const gradeConfig = (score) => {
  if (score >= 85) return { label: 'Excellent',  color: 'text-white', ring: 'text-white' };
  if (score >= 70) return { label: 'Good',        color: 'text-primary-300',   ring: 'text-primary-300'   };
  if (score >= 55) return { label: 'Fair',        color: 'text-dark-200',   ring: 'text-dark-200'   };
  return              { label: 'Needs Work',    color: 'text-dark-400',     ring: 'text-dark-400'     };
};

const EvaluationPanel = ({ evaluation }) => {
  if (!evaluation) return null;
  const { scores, totalScore, strengths, weaknesses, feedback } = evaluation;
  const grade = gradeConfig(totalScore);

  const scoreItems = [
    { label: 'Logic',          score: scores.logic,         max: 30, color: 'bg-primary-300'    },
    { label: 'Concept Usage',  score: scores.conceptUsage,  max: 30, color: 'bg-primary-400'  },
    { label: 'Readability',    score: scores.readability,   max: 20, color: 'bg-primary-500'     },
    { label: 'Best Practices', score: scores.bestPractices, max: 20, color: 'bg-primary-600'  },
  ];

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Total Score */}
      <div className="flex items-center gap-5">
        {/* Circular Score Ring */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - totalScore / 100)}`}
              className={`progress-ring-circle ${grade.ring}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${grade.color}`}>{totalScore}</span>
            <span className="text-xs text-dark-400">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Mission Score</p>
          <h3 className={`text-2xl font-bold ${grade.color}`}>{grade.label}</h3>
          <p className="text-dark-400 text-xs mt-1">
            {totalScore >= 70 ? 'Great work! These concepts are strengthening.' : 'Review the feedback below to level up.'}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div>
        <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={13} className="text-primary-400" />
          Score Breakdown
        </h4>
        <div className="space-y-3">
          {scoreItems.map((item) => (
            <ScoreBar key={item.label} {...item} />
          ))}
        </div>
      </div>

      {/* Strengths */}
      {strengths?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-primary-400" />
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-dark-200">
                <CheckCircle2 size={14} className="text-primary-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <XCircle size={13} className="text-dark-400" />
            Areas to Improve
          </h4>
          <ul className="space-y-1.5">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-dark-200">
                <XCircle size={14} className="text-dark-400 shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <h4 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MessageSquare size={13} />
            Mentor Feedback
          </h4>
          <p className="text-sm text-dark-200 leading-relaxed">{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default EvaluationPanel;
