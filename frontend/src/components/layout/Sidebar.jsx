/**
 * components/layout/Sidebar.jsx
 * Collapsible dark sidebar with navigation links and user info.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, CalendarCheck, Bot, History,
  LogOut, Zap, ChevronRight, Flame, X, Target, Swords
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/topics',       label: 'My Topics',       icon: BookOpen },
  { to: '/revisions',    label: 'Revisions',       icon: CalendarCheck },
  { to: '/ai-revision',  label: 'AI Revision',     icon: Bot },
  { to: '/mission',      label: 'Mission',         icon: Target },
  { to: '/boss-battle',  label: 'Boss Battle',     icon: Swords },
  { to: '/history',      label: 'History',         icon: History },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Revision OS</h1>
              <p className="text-xs text-dark-500">Learn · Revise · Master</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                isActive
                  ? 'nav-item-active flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-primary-600/20 to-violet-600/10 border border-primary-500/20'
                  : 'nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-dark-400 font-medium text-sm hover:bg-dark-700/60 hover:text-white transition-all duration-200'
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-primary-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Streak Badge */}
        {user?.revisionStreak > 0 && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-300">
                  {user.revisionStreak} Day Streak 🔥
                </p>
                <p className="text-xs text-dark-500">Keep it up!</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
