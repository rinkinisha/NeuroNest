/**
 * components/revision/RevisionCard.jsx
 * Displays a single revision with status, topic info, and complete action.
 */

import { CheckCircle, Clock, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate, daysUntil } from '../../utils/dateHelpers';

const intervalLabels = {
  3:  { label: 'Day 3',  color: 'primary' },
  7:  { label: 'Day 7',  color: 'info' },
  21: { label: 'Day 21', color: 'purple' },
  45: { label: 'Day 45', color: 'warning' },
  90: { label: 'Day 90', color: 'success' },
};

const statusConfig = {
  pending:   { icon: Clock,         color: 'text-blue-400',  bg: 'bg-blue-500/10',   label: 'Pending' },
  completed: { icon: CheckCircle,   color: 'text-green-400', bg: 'bg-green-500/10',  label: 'Completed' },
  overdue:   { icon: AlertTriangle, color: 'text-red-400',   bg: 'bg-red-500/10',    label: 'Overdue' },
  skipped:   { icon: ChevronRight,  color: 'text-dark-500',  bg: 'bg-dark-700/40',   label: 'Skipped' },
};

const RevisionCard = ({ revision, onComplete }) => {
  const [completing, setCompleting] = useState(false);
  const [score, setScore] = useState(80);
  const [showScoreInput, setShowScoreInput] = useState(false);

  const topic = revision.topicId;
  const interval = intervalLabels[revision.intervalDay] || { label: `Day ${revision.intervalDay}`, color: 'gray' };
  const status = statusConfig[revision.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const days = daysUntil(revision.scheduledDate);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(revision._id, { score, confidenceLevel: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low' });
    } finally {
      setCompleting(false);
      setShowScoreInput(false);
    }
  };

  const isActionable = revision.status === 'pending' || revision.status === 'overdue';

  return (
    <div
      className={`
        glass-card p-4 flex flex-col gap-3 animate-slide-up
        ${revision.status === 'overdue' ? 'border-red-500/20' : ''}
        ${revision.status === 'completed' ? 'opacity-70' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={interval.color}>{interval.label}</Badge>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.color}`}>
              <StatusIcon size={11} />
              {status.label}
            </div>
          </div>

          <h3 className="font-semibold text-white mt-2 text-sm leading-snug line-clamp-1">
            {topic?.title || 'Unknown Topic'}
          </h3>

          {topic?.subject && (
            <p className="text-xs text-dark-500 mt-0.5">{topic.subject}</p>
          )}
        </div>

        {/* Score (for completed) */}
        {revision.status === 'completed' && revision.score !== null && (
          <div className="text-right shrink-0">
            <div className={`text-lg font-bold ${revision.score >= 80 ? 'text-green-400' : revision.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {revision.score}
            </div>
            <p className="text-xs text-dark-600">score</p>
          </div>
        )}
      </div>

      {/* Schedule Info */}
      <div className="flex items-center gap-3 text-xs text-dark-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDate(revision.scheduledDate)}
        </span>
        {revision.status !== 'completed' && (
          <span className={`font-medium ${days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-dark-400'}`}>
            {days === 0 ? '⚡ Due Today' : days < 0 ? `${Math.abs(days)} days overdue` : `in ${days} days`}
          </span>
        )}
        {revision.completedDate && (
          <span className="text-green-600">✓ Completed {formatDate(revision.completedDate)}</span>
        )}
      </div>

      {/* Tags */}
      {topic?.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {topic.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="gray">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Complete Action */}
      {isActionable && (
        <div className="pt-1 border-t border-dark-700/40">
          {showScoreInput ? (
            <div className="space-y-2">
              <label className="text-xs text-dark-400">
                Self-assessment score (0–100): <span className="text-primary-400 font-bold">{score}</span>
              </label>
              <input
                type="range"
                min="0" max="100" step="5"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="success"
                  size="sm"
                  loading={completing}
                  onClick={handleComplete}
                  className="flex-1"
                >
                  ✓ Submit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowScoreInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowScoreInput(true)}
              className="w-full"
              icon={Zap}
            >
              Mark Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RevisionCard;
