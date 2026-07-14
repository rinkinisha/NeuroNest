/**
 * components/battle/XPBar.jsx
 * Animated XP progress bar with combo multiplier flash effect.
 */

import { Zap, Flame } from 'lucide-react';

const XPBar = ({ totalXp, maxXp = 300, comboMultiplier = 1, comboActive = false }) => {
  const pct = Math.min((totalXp / maxXp) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      {/* XP Icon */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap size={16} className="text-primary-400" />
        <span className="text-sm font-bold text-white tabular-nums">{totalXp}</span>
        <span className="text-xs text-dark-500">XP</span>
      </div>

      {/* XP Bar */}
      <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Combo Badge */}
      {comboActive && comboMultiplier > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/20 border border-primary-500/40 shrink-0">
          <Flame size={12} className="text-primary-400" />
          <span className="text-xs font-bold text-primary-400">{comboMultiplier}× COMBO</span>
        </div>
      )}
    </div>
  );
};

export default XPBar;
