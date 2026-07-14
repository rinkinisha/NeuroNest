/**
 * pages/Dashboard.jsx
 * Main dashboard with all stats, memory health ring, upcoming revisions, and weak topics.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarCheck, AlertTriangle, Brain,
  Flame, TrendingUp, Plus, ArrowRight, Clock
} from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import StreakBadge from '../components/dashboard/StreakBadge';
import WeakTopicsList from '../components/dashboard/WeakTopicsList';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatDate, daysUntil } from '../utils/dateHelpers';

// Memory Health Ring Component
const MemoryHealthRing = ({ percent }) => {
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color =
    percent >= 75 ? '#22c55e' :
      percent >= 50 ? '#f59e0b' :
        percent >= 25 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="progress-ring-circle"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{percent}%</span>
          <span className="text-xs text-dark-500">health</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Memory Health</p>
        <p className="text-xs text-dark-500">
          {percent >= 75 ? '🏆 Excellent!' : percent >= 50 ? '👍 Good' : percent >= 25 ? '⚠️ Needs Work' : '🚨 Critical'}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard/stats');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader fullPage text="Loading your dashboard..." />;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
      greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {stats?.dueTodayCount > 0
              ? `You have ${stats.dueTodayCount} revision${stats.dueTodayCount > 1 ? 's' : ''} due today`
              : 'No revisions due today – great job!'}
          </p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Topics"
          value={stats?.totalTopics ?? 0}
          subtitle={`${stats?.archivedTopics ?? 0} archived`}
          icon={BookOpen}
          color="primary"
          onClick={() => navigate('/topics')}
        />
        <StatCard
          title="Due Today"
          value={stats?.dueTodayCount ?? 0}
          subtitle="scheduled revisions"
          icon={CalendarCheck}
          color="blue"
          onClick={() => navigate('/revisions')}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueCount ?? 0}
          subtitle="need attention"
          icon={AlertTriangle}
          color={stats?.overdueCount > 0 ? 'red' : 'green'}
          onClick={() => navigate('/revisions')}
        />
        <StatCard
          title="Completed"
          value={stats?.completedTotal ?? 0}
          subtitle={`of ${stats?.totalRevisions ?? 0} total`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Middle Row: Memory Health + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Memory Health Ring */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <MemoryHealthRing percent={stats?.memoryHealth ?? 0} />
          <div className="mt-4 text-center">
            <p className="text-xs text-dark-500">
              {stats?.completedTotal ?? 0} / {stats?.totalRevisions ?? 0} revisions completed
            </p>
          </div>
        </div>

        {/* Streak Badge */}
        <StreakBadge
          streak={stats?.revisionStreak ?? user?.revisionStreak ?? 0}
          longestStreak={stats?.longestStreak ?? user?.longestStreak ?? 0}
        />

        {/* Upcoming Revisions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
              <Clock size={15} className="text-primary-400" />
              Upcoming
            </h3>
            <button
              onClick={() => navigate('/revisions')}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              All <ArrowRight size={12} />
            </button>
          </div>

          {stats?.upcomingRevisions?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-dark-500">No upcoming revisions</p>
              <p className="text-xs text-dark-600 mt-1">Add topics to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.upcomingRevisions?.slice(0, 4).map((rev) => {
                const days = daysUntil(rev.scheduledDate);
                return (
                  <div
                    key={rev._id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-700/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/revisions')}
                  >
                    <Badge variant="primary" className="shrink-0">Day {rev.intervalDay}</Badge>
                    <span className="text-xs text-dark-300 truncate flex-1">
                      {rev.topicId?.title}
                    </span>
                    <span className="text-xs text-dark-600 shrink-0">
                      {days === 1 ? 'tmrw' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row has been removed */}
    </div>
  );
};

export default Dashboard;
