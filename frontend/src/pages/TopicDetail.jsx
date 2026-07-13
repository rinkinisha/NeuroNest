/**
 * pages/TopicDetail.jsx – Detailed view for a single topic with revision timeline.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, CheckCircle, Clock, AlertTriangle,
  CalendarDays, BookOpen, Brain, Zap
} from 'lucide-react';
import API from '../api/axios';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import TopicForm from '../components/topics/TopicForm';
import Loader from '../components/ui/Loader';
import { formatDate, daysUntil } from '../utils/dateHelpers';
import toast from 'react-hot-toast';

const intervalLabels = { 3: 'Day 3', 7: 'Day 7', 21: 'Day 21', 45: 'Day 45', 90: 'Day 90' };

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchTopic = async () => {
    try {
      const { data: res } = await API.get(`/topics/${id}`);
      setData(res.data);
    } catch {
      toast.error('Topic not found');
      navigate('/topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopic(); }, [id]);

  const handleUpdate = async (formData) => {
    setEditLoading(true);
    try {
      await API.put(`/topics/${id}`, formData);
      toast.success('Topic updated!');
      setEditOpen(false);
      fetchTopic();
    } catch {
      toast.error('Failed to update topic');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this topic and all revisions?')) return;
    try {
      await API.delete(`/topics/${id}`);
      toast.success('Topic deleted');
      navigate('/topics');
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  if (loading) return <Loader fullPage text="Loading topic..." />;
  if (!data) return null;

  const { topic, revisions, sessions } = data;
  const completionPercent = Math.round((topic.revisionCount / topic.totalScheduled) * 100);

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={16} className="text-green-400" />;
    if (status === 'overdue') return <AlertTriangle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-blue-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/topics')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Topics
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Topic Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {topic.tags?.map((tag) => <Badge key={tag} variant="primary">{tag}</Badge>)}
              <Badge variant={topic.isArchived ? 'gray' : 'success'}>
                {topic.isArchived ? 'Archived' : 'Active'}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
            {topic.subject && <p className="text-dark-400 mt-1">{topic.subject}</p>}
            {topic.description && (
              <p className="text-dark-300 text-sm mt-3 leading-relaxed">{topic.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-dark-500 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} /> Learned: {formatDate(topic.dateLearnerd)}
              </span>
              {topic.lastRevisedAt && (
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-primary-400" /> Last revised: {formatDate(topic.lastRevisedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Memory Score */}
          <div className="text-center">
            <div className={`text-4xl font-black ${
              topic.memoryScore >= 80 ? 'text-green-400' :
              topic.memoryScore >= 60 ? 'text-amber-400' :
              topic.memoryScore >= 40 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {topic.memoryScore}%
            </div>
            <p className="text-xs text-dark-500">memory score</p>
            <div className="mt-2 w-20 h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  topic.memoryScore >= 80 ? 'bg-green-500' :
                  topic.memoryScore >= 60 ? 'bg-amber-500' :
                  topic.memoryScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${topic.memoryScore}%` }}
              />
            </div>
            <p className="text-xs text-dark-600 mt-1">{completionPercent}% complete</p>
          </div>
        </div>

        {/* Notes */}
        {topic.notes && (
          <div className="mt-5 p-4 bg-dark-800/60 rounded-xl border border-dark-700/40">
            <p className="text-xs font-semibold text-dark-500 mb-2 flex items-center gap-1">
              <BookOpen size={11} /> Notes
            </p>
            <p className="text-sm text-dark-300 whitespace-pre-wrap leading-relaxed">{topic.notes}</p>
          </div>
        )}
      </div>

      {/* Revision Timeline */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Brain size={18} className="text-primary-400" />
          Revision Schedule
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-dark-700/60" />

          <div className="space-y-4">
            {revisions.map((rev, i) => {
              const days = daysUntil(rev.scheduledDate);
              return (
                <div key={rev._id} className="flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    rev.status === 'completed' ? 'bg-green-500/20 border-green-500' :
                    rev.status === 'overdue' ? 'bg-red-500/20 border-red-500' :
                    'bg-dark-700 border-dark-600'
                  }`}>
                    {statusIcon(rev.status)}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 p-4 rounded-xl border transition-colors ${
                    rev.status === 'completed' ? 'bg-green-500/5 border-green-500/20' :
                    rev.status === 'overdue' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-dark-800/40 border-dark-700/40'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {intervalLabels[rev.intervalDay] || `Day ${rev.intervalDay}`}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rev.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          rev.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                          'bg-dark-700 text-dark-400'
                        }`}>
                          {rev.status}
                        </span>
                      </div>
                      <div className="text-xs text-dark-500">
                        {formatDate(rev.scheduledDate)}
                        {rev.status !== 'completed' && (
                          <span className={`ml-2 font-medium ${days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-dark-400'}`}>
                            {days === 0 ? '(today!)' : days < 0 ? `(${Math.abs(days)}d overdue)` : `(in ${days}d)`}
                          </span>
                        )}
                        {rev.status === 'completed' && rev.score !== null && (
                          <span className="ml-2 text-green-400 font-bold">Score: {rev.score}</span>
                        )}
                      </div>
                    </div>
                    {rev.notes && (
                      <p className="text-xs text-dark-400 mt-2">{rev.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Topic" size="lg">
        <TopicForm
          initialData={topic}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          loading={editLoading}
        />
      </Modal>
    </div>
  );
};

export default TopicDetail;
