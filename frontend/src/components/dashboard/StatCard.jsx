/**
 * components/dashboard/StatCard.jsx
 * Animated stat card with icon, value, trend indicator.
 */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  trendLabel,
  onClick,
}) => {
  const colorConfig = {
    primary: {
      icon: 'text-primary-400',
      iconBg: 'bg-primary-500/10 border-primary-500/20',
      glow: 'hover:shadow-glow-sm',
      gradient: 'from-primary-600/10 to-violet-600/5',
    },
    amber: {
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      glow: '',
      gradient: 'from-amber-600/10 to-orange-600/5',
    },
    red: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/10 border-red-500/20',
      glow: '',
      gradient: 'from-red-600/10 to-rose-600/5',
    },
    green: {
      icon: 'text-green-400',
      iconBg: 'bg-green-500/10 border-green-500/20',
      glow: '',
      gradient: 'from-green-600/10 to-emerald-600/5',
    },
    blue: {
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      glow: '',
      gradient: 'from-blue-600/10 to-cyan-600/5',
    },
  };

  const cfg = colorConfig[color] || colorConfig.primary;

  return (
    <div
      onClick={onClick}
      className={`
        glass-card p-5 flex flex-col gap-3 relative overflow-hidden
        transition-all duration-300 hover:border-dark-600/60
        ${cfg.glow}
        ${onClick ? 'cursor-pointer' : ''}
        animate-slide-up
      `}
    >
      {/* Background gradient decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${cfg.gradient} rounded-full blur-2xl`} />

      {/* Header */}
      <div className="flex items-start justify-between relative">
        <div className={`p-2.5 rounded-xl border ${cfg.iconBg}`}>
          {Icon && <Icon size={20} className={cfg.icon} />}
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
            trend > 0
              ? 'bg-green-500/10 text-green-400'
              : trend < 0
              ? 'bg-red-500/10 text-red-400'
              : 'bg-dark-700/60 text-dark-400'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {trendLabel || Math.abs(trend)}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative">
        <div className="text-3xl font-bold text-white tracking-tight">
          {value !== undefined && value !== null ? value : '—'}
        </div>
        <p className="text-sm font-medium text-dark-400 mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-dark-600 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
