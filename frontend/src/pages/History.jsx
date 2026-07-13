/**
 * pages/History.jsx – Session history with pagination.
 */

import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, CheckCircle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axios';
import Loader from '../components/ui/Loader';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/dateHelpers';
import toast from 'react-hot-toast';

const History = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/revisions/sessions?page=${page}&limit=15`);
        setSessions(data.data);
        setPages(data.pages);
        setTotal(data.total);
      } catch {
        toast.error('Failed to load session history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HistoryIcon className="text-primary-400" size={24} />
          Session History
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          {total} total revision sessions completed
        </p>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" text="Loading history..." />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <HistoryIcon size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300 mb-2">No sessions yet</h3>
          <p className="text-dark-500 text-sm">Complete your first revision to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session._id} className="glass-card p-4 flex items-start gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={18} className="text-primary-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {session.topicId?.title || 'Deleted Topic'}
                    </p>
                    {session.topicId?.subject && (
                      <p className="text-xs text-dark-500">{session.topicId.subject}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.score !== null && (
                      <span className={`text-sm font-bold ${
                        session.score >= 80 ? 'text-green-400' :
                        session.score >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {session.score}pts
                      </span>
                    )}
                    {session.aiUsed && <Badge variant="purple">AI Used</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-dark-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDate(session.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {session.durationMinutes > 0 && (
                    <span>{session.durationMinutes} min</span>
                  )}
                  {session.confidenceLevel && (
                    <Badge variant={
                      session.confidenceLevel === 'high' ? 'success' :
                      session.confidenceLevel === 'medium' ? 'warning' : 'danger'
                    }>
                      {session.confidenceLevel} confidence
                    </Badge>
                  )}
                  {session.selfAssessment && (
                    <Badge variant="gray">{session.selfAssessment}</Badge>
                  )}
                </div>

                {session.notesAdded && (
                  <p className="text-xs text-dark-400 mt-2 line-clamp-2">{session.notesAdded}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-dark-800/60 border border-dark-700/40 text-dark-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-dark-400">
            Page <span className="text-white font-bold">{page}</span> of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-lg bg-dark-800/60 border border-dark-700/40 text-dark-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
