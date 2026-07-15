/**
 * components/mission/MissionCard.jsx
 * Displays a generated mission's title, description, and requirements.
 */

import { Target, Clock, Tag, CheckSquare } from 'lucide-react';

const difficultyConfig = {
  beginner:     { label: 'Beginner',     cls: 'badge-success' },
  intermediate: { label: 'Intermediate', cls: 'badge-warning' },
  advanced:     { label: 'Advanced',     cls: 'badge-danger'  },
};

const MissionCard = ({ mission }) => {
  if (!mission) return null;
  const diff = difficultyConfig[mission.difficulty] || difficultyConfig.intermediate;

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-glow-sm shrink-0">
            <Target size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{mission.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={diff.cls}>{diff.label}</span>
              <span className="flex items-center gap-1 text-xs text-dark-400">
                <Clock size={11} />
                ~{mission.estimatedDurationMinutes} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-dark-300 text-sm leading-relaxed">{mission.description}</p>

      {/* Requirements */}
      <div>
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckSquare size={13} className="text-primary-400" />
          Requirements
        </h3>
        <ul className="space-y-2">
          {mission.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-dark-200">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Expected Concepts */}
      <div>
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Tag size={13} className="text-violet-400" />
          Concepts Tested
        </h3>
        <div className="flex flex-wrap gap-2">
          {mission.expectedConcepts.map((c, i) => (
            <span key={i} className="badge bg-violet-500/15 text-violet-300 border border-violet-500/25 text-xs">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionCard;
