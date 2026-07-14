/**
 * App.jsx – Root component with React Router configuration.
 * Defines all routes: public (Login/Signup) and protected (app routes).
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Login        from './pages/Login';
import Signup       from './pages/Signup';
import Dashboard    from './pages/Dashboard';
import Topics       from './pages/Topics';
import TopicDetail  from './pages/TopicDetail';
import Revisions    from './pages/Revisions';
import AIRevision   from './pages/AIRevision';
import History      from './pages/History';
import NotFound     from './pages/NotFound';
// Stage 5 & 6
import MissionChallenge from './pages/MissionChallenge';
import BossBattle       from './pages/BossBattle';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(71, 85, 105, 0.4)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
            },
          }}
        />

        <Routes>
          {/* ── Public Routes ───────────────────────────────────── */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected Routes (with Sidebar + Navbar layout) ─── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/topics"       element={<Topics />} />
            <Route path="/topics/:id"   element={<TopicDetail />} />
            <Route path="/revisions"    element={<Revisions />} />
            <Route path="/ai-revision"  element={<AIRevision />} />
            <Route path="/history"      element={<History />} />
            {/* Stage 5 & 6 */}
            <Route path="/mission"      element={<MissionChallenge />} />
            <Route path="/boss-battle"  element={<BossBattle />} />
          </Route>

          {/* ── Default Redirects ───────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
