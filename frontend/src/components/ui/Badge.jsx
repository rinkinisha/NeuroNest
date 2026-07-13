/**
 * components/ui/Badge.jsx – Tag/status badge component
 */

const variantClasses = {
  primary: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  danger:  'bg-red-500/20 text-red-400 border-red-500/30',
  info:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple:  'bg-violet-500/20 text-violet-400 border-violet-500/30',
  gray:    'bg-dark-700/60 text-dark-400 border-dark-600/40',
};

const Badge = ({ children, variant = 'primary', className = '', onClick }) => {
  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full
        text-xs font-medium border
        ${variantClasses[variant] || variantClasses.primary}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
