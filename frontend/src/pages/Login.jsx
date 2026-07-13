/**
 * pages/Login.jsx – Login page with animated design
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4" style={{
      backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 60%)',
    }}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-glow-md">
              <Zap size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white">
            Revision <span className="gradient-text">OS</span>
          </h1>
          <p className="text-dark-400 mt-2 text-sm">Learn Anywhere, Revise Here</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-dark-500 text-sm mb-6">Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign In <ArrowRight size={16} />
            </Button>
          </form>

          <p className="text-center text-dark-500 text-sm mt-6">
            New here?{' '}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { emoji: '🧠', text: 'Spaced Repetition' },
            { emoji: '🤖', text: 'AI Revision' },
            { emoji: '🔥', text: 'Streak Tracking' },
          ].map(({ emoji, text }) => (
            <div key={text} className="text-center p-3 rounded-xl bg-dark-800/40 border border-dark-700/30">
              <div className="text-xl mb-1">{emoji}</div>
              <p className="text-xs text-dark-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
