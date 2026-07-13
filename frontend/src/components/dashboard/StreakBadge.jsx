/**
 * components/dashboard/StreakBadge.jsx
 * Animated flame streak badge with milestone labels.
 */

import { Flame, Trophy, Target } from 'lucide-react';

const StreakBadge = ({ streak = 0, longestStreak = 0 }) => {
  const getMilestone = (s) => {
    if (s >= 90) return { label: 'Legend', color: 'from-purple-500 to-pink-500' };
    if (s >= 30) return { label: 'Master',  color: 'from-amber-500 to-orange-500' };
    if (s >= 14) return { label: 'Expert',  color: 'from-yellow-500 to-amber-500' };
    if (s >= 7)  return { label: 'Pro',     color: 'from-green-500 to-emerald-500' };
    if (s >= 3)  return { label: 'Rising',  color: 'from-blue-500 to-cyan-500' };
    return       { label: 'Beginner',       color: 'from-dark-500 to-dark-600' };
  };

  const milestone = getMilestone(streak);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
          <Flame size={16} className="text-amber-400" />
          Revision Streak
        </h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${milestone.color} text-white`}>
          {milestone.label}
        </span>
      </div>

      {/* Main Streak Display */}
      <div className="flex items-end gap-4">
        <div className="relative">
          {streak > 0 && (
            <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl animate-pulse-slow" />
          )}
          <div className="relative flex items-center gap-2">
            <Flame
              size={streak > 0 ? 40 : 32}
              className={streak > 0 ? 'text-amber-400 animate-bounce-soft' : 'text-dark-600'}
            />
            <span className="text-5xl font-black text-white">{streak}</span>
          </div>
        </div>

        <div className="mb-1">
          <p className="text-dark-400 text-sm">day{streak !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-dark-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-dark-500 text-xs mb-1">
            <Trophy size={12} className="text-amber-500" />
            Best Streak
          </div>
          <p className="text-lg font-bold text-white">{longestStreak} <span className="text-xs font-normal text-dark-500">days</span></p>
        </div>
        <div className="bg-dark-800/40 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-dark-500 text-xs mb-1">
            <Target size={12} className="text-primary-500" />
            Next Goal
          </div>
          <p className="text-lg font-bold text-white">
            {streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 90}
            <span className="text-xs font-normal text-dark-500"> days</span>
          </p>
        </div>
      </div>

      {/* Progress Bar to next milestone */}
      {streak < 90 && (
        <div className="mt-3">
          <div className="h-1.5 bg-dark-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${milestone.color} rounded-full transition-all duration-1000`}
              style={{
                width: `${Math.min(
                  (streak /
                    (streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 90)) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakBadge;
