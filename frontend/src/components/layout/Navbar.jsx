/**
 * components/layout/Navbar.jsx
 * Top navigation bar with hamburger menu toggle and breadcrumbs.
 */

import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const routeLabels = {
  '/dashboard':   'Dashboard',
  '/topics':      'My Topics',
  '/revisions':   'Revisions',
  '/ai-revision': 'AI Revision',
  '/history':     'Session History',
};

const Navbar = ({ onMenuToggle }) => {
  const location = useLocation();
  const { user } = useAuth();

  const currentLabel = routeLabels[location.pathname] || 'Revision OS';

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
      {/* Left: Menu toggle + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white">{currentLabel}</h2>
          <p className="text-xs text-dark-500 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search (visual only for now) */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/60 border border-dark-700/50 text-dark-500 hover:text-dark-300 text-xs transition-colors">
          <Search size={14} />
          <span>Search...</span>
          <kbd className="text-xs bg-dark-700/60 px-1.5 py-0.5 rounded text-dark-600">⌘K</kbd>
        </button>

        {/* Notifications Bell */}
        <button className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition-colors">
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
