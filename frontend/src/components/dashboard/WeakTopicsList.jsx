/**
 * components/dashboard/WeakTopicsList.jsx
 * Lists topics with low memory scores that need more revision.
 */

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Brain } from 'lucide-react';
import Badge from '../ui/Badge';

const MemoryBar = ({ score }) => {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-amber-500' :
    score >= 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-dark-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-dark-500 w-8 text-right">{score}%</span>
    </div>
  );
};

const WeakTopicsList = ({ topics = [] }) => {
  const navigate = useNavigate();

  if (topics.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-dark-300">Weak Topics</h3>
        </div>
        <div className="flex flex-col items-center py-6 gap-2 text-center">
          <Brain size={32} className="text-dark-600" />
          <p className="text-sm text-dark-400">No weak topics! 🎉</p>
          <p className="text-xs text-dark-600">All your topics are well-memorized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          Weak Topics
          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
            {topics.length}
          </span>
        </h3>
        <button
          onClick={() => navigate('/topics')}
          className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => (
          <div
            key={topic._id}
            onClick={() => navigate(`/topics/${topic._id}`)}
            className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/40 hover:bg-dark-700/40 border border-dark-700/30 hover:border-amber-500/20 cursor-pointer transition-all duration-200 group"
          >
            {/* Memory score ring */}
            <div className="shrink-0 mt-0.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                topic.memoryScore < 30
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {topic.memoryScore}
              </div>
            </div>

            {/* Topic Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition-colors">
                {topic.title}
              </p>
              <MemoryBar score={topic.memoryScore} />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {topic.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="gray" className="text-xs">{tag}</Badge>
                ))}
                <span className="text-xs text-dark-600">
                  {topic.revisionCount} / 5 revisions
                </span>
              </div>
            </div>

            <ChevronRight size={14} className="text-dark-600 group-hover:text-primary-400 transition-colors shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeakTopicsList;
