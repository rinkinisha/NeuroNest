/**
 * components/ui/Button.jsx – Reusable button with variants and loading state
 */

import Loader from './Loader';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 text-white shadow-lg hover:shadow-glow-sm',
    secondary: 'bg-dark-700/80 hover:bg-dark-700 border border-dark-600/60 hover:border-primary-500/50 text-dark-200 hover:text-white',
    danger:    'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300',
    ghost:     'text-dark-400 hover:text-white hover:bg-dark-700/60',
    success:   'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
    xl: 'px-10 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader size="sm" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
