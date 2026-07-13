/**
 * pages/Revisions.jsx
 * Shows due today + overdue revisions with a complete flow.
 */

import { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import API from '../api/axios';
import RevisionCard from '../components/revision/RevisionCard';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Revisions = () => {
  const [dueData, setDueData] = useState({ dueToday: [], overdue: [], totalDue: 0 });
  const [allRevisions, setAllRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('due');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const [dueRes, allRes] = await Promise.all([
        API.get('/revisions/due'),
        API.get(`/revisions${statusFilter ? `?status=${statusFilter}` : ''}`),
      ]);
      setDueData(dueRes.data.data);
      setAllRevisions(allRes.data.data);
    } catch {
      toast.error('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRevisions(); }, [statusFilter]);

  const handleComplete = async (revisionId, payload) => {
    try {
      await API.put(`/revisions/${revisionId}/complete`, payload);
      toast.success('Revision completed! 🎉');
      fetchRevisions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark complete');
    }
  };

  const tabs = [
    {
      id: 'due',
      label: 'Due Today',
      icon: Clock,
      count: dueData.dueToday?.length || 0,
      color: 'text-amber-400',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertTriangle,
      count: dueData.overdue?.length || 0,
      color: 'text-red-400',
    },
    {
      id: 'all',
      label: 'All Revisions',
      icon: CalendarCheck,
      count: allRevisions.length,
      color: 'text-primary-400',
    },
  ];

  const currentItems =
    activeTab === 'due' ? dueData.dueToday :
    activeTab === 'overdue' ? dueData.overdue :
    allRevisions;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="text-primary-400" size={24} />
            Revisions
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {dueData.totalDue > 0
              ? `${dueData.totalDue} revision${dueData.totalDue > 1 ? 's' : ''} need your attention`
              : 'You\'re all caught up! 🎉'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchRevisions}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/60 p-1 rounded-xl border border-dark-700/40 w-fit">
        {tabs.map(({ id, label, icon: Icon, count, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-dark-700 text-white shadow-sm'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            <Icon size={15} className={activeTab === id ? color : ''} />
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                id === 'overdue' && count > 0
                  ? 'bg-red-500/20 text-red-400'
                  : id === 'due' && count > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-primary-500/20 text-primary-400'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All Tab – Status Filter */}
      {activeTab === 'all' && (
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'completed', 'overdue', 'skipped'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                  : 'bg-dark-800/40 text-dark-500 border-dark-700/30 hover:text-dark-300'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" text="Loading revisions..." />
        </div>
      ) : currentItems.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <CheckCircle size={48} className="text-green-500/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300 mb-2">
            {activeTab === 'overdue'
              ? 'No overdue revisions!'
              : activeTab === 'due'
              ? 'No revisions due today!'
              : 'No revisions found'}
          </h3>
          <p className="text-dark-500 text-sm">
            {activeTab === 'due' ? 'Enjoy your free time or add new topics to learn.' : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((revision) => (
            <RevisionCard
              key={revision._id}
              revision={revision}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Revisions;
