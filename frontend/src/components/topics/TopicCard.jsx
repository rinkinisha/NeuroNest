/**
 * components/topics/TopicCard.jsx
 * Displays a topic with memory score, tags, revision progress, and actions.
 */

import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, MoreVertical, Edit, Trash2, Archive } from 'lucide-react';
import { useState } from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateHelpers';

const difficultyConfig = {
  1: { label: 'Easy',      color: 'success' },
  2: { label: 'Moderate',  color: 'info' },
  3: { label: 'Medium',    color: 'primary' },
  4: { label: 'Hard',      color: 'warning' },
  5: { label: 'Very Hard', color: 'danger' },
};

const ProgressRing = ({ value, size = 44, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? '#22c55e' :
    value >= 60 ? '#f59e0b' :
    value >= 40 ? '#f97316' : '#ef4444';

  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="10" fontWeight="700"
      >
        {value}%
      </text>
    </svg>
  );
};

const TopicCard = ({ topic, onEdit, onDelete, onArchive }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const diff = difficultyConfig[topic.difficulty] || difficultyConfig[3];
  const completionPercent = topic.totalScheduled > 0
    ? Math.round((topic.revisionCount / topic.totalScheduled) * 100)
    : 0;

  return (
    <div
      className="glass-card-hover p-5 flex flex-col gap-4 animate-slide-up group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex-1 min-w-0 ${topic._id.toString().startsWith('refl-') ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={() => {
            if (!topic._id.toString().startsWith('refl-')) {
              navigate(`/topics/${topic._id}`);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={14} className="text-primary-400 shrink-0" />
            <h3 className={`font-semibold text-white text-sm leading-tight line-clamp-2 transition-colors ${!topic._id.toString().startsWith('refl-') ? 'group-hover:text-primary-300' : ''}`}>
              {topic.title}
            </h3>
          </div>
          {topic.subject && (
            <p className="text-xs text-dark-500">{topic.subject}</p>
          )}
        </div>

        {/* Memory Ring */}
        <div className="shrink-0">
          <ProgressRing value={topic.memoryScore || 0} />
        </div>
      </div>

      {/* Description */}
      {topic.description && (
        <p className="text-xs text-dark-400 line-clamp-2 leading-relaxed">
          {topic.description}
        </p>
      )}

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="primary">{tag}</Badge>
          ))}
          {topic.tags.length > 3 && (
            <Badge variant="gray">+{topic.tags.length - 3}</Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-dark-700/40">
        <div className="flex items-center gap-1.5 text-xs text-dark-500">
          <CalendarDays size={12} />
          <span>{formatDate(topic.dateLearnerd)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={diff.color}>{diff.label}</Badge>

          {/* Revision progress */}
          <span className="text-xs text-dark-500">
            {topic.revisionCount}/{topic.totalScheduled} rev
          </span>
        </div>
      </div>

      {/* Action Menu */}
      {!topic._id.toString().startsWith('refl-') && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg text-dark-600 hover:text-dark-300 hover:bg-dark-700/60 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-40 bg-dark-800 border border-dark-700/60 rounded-xl shadow-xl z-10 py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { icon: Edit,    label: 'Edit',    action: () => { onEdit?.(topic); setMenuOpen(false); }, color: '' },
                { icon: Archive, label: 'Archive', action: () => { onArchive?.(topic); setMenuOpen(false); }, color: '' },
                { icon: Trash2,  label: 'Delete',  action: () => { onDelete?.(topic); setMenuOpen(false); }, color: 'text-red-400 hover:bg-red-500/10' },
              ].map(({ icon: Icon, label, action, color }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-dark-300 hover:bg-dark-700/60 hover:text-white transition-colors ${color}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicCard;
