/**
 * components/ui/Loader.jsx – Full-page and inline loading spinners
 */

const Loader = ({ fullPage = false, size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-dark-600 border-t-primary-500 animate-spin`}
      />
      {text && <p className="text-dark-400 text-sm animate-pulse">{text}</p>}
      <img 
        src="/ninja.gif" 
        alt="Loading animation" 
        className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] mt-1"
      />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-dark-600 border-t-primary-500 animate-spin" />
          <p className="text-dark-300 text-sm font-medium animate-pulse">
            {text || 'Loading Revision OS...'}
          </p>
          <img 
            src="/ninja.gif" 
            alt="Loading animation" 
            className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] mt-2"
          />
        </div>
      </div>
    );
  }

  return spinner;
};

export default Loader;
