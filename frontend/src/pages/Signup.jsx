/**
 * pages/Signup.jsx – Registration page
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return { strength: 0, label: '' };
    if (p.length < 6) return { strength: 1, label: 'Too short', color: 'bg-red-500' };
    if (p.length < 8) return { strength: 2, label: 'Weak', color: 'bg-orange-500' };
    if (p.length < 12 || !/\d/.test(p)) return { strength: 3, label: 'Good', color: 'bg-amber-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const { strength, label, color } = passwordStrength();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength < 2) return;
    setLoading(true);
    await signup(form.name, form.email, form.password);
    setLoading(false);
  };

  const features = [
    'Spaced repetition at Day 3, 7, 21, 45 & 90',
    'AI-powered revision conversations',
    'Memory health tracking & analytics',
    'Streak system & gamification',
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4" style={{
      backgroundImage: 'radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(139,92,246,0.08) 0%, transparent 60%)',
    }}>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-slide-up">
        {/* Left: Features */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-glow-md">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Revision OS</h1>
              <p className="text-dark-500 text-sm">Learn Anywhere, Revise Here</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Master anything with <span className="gradient-text">science-backed</span> revision
          </h2>

          <p className="text-dark-400 mb-8 leading-relaxed">
            Revision OS uses spaced repetition and AI to help you retain knowledge 
            longer and study smarter — not harder.
          </p>

          <div className="space-y-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={11} className="text-primary-400" />
                </div>
                <p className="text-dark-300 text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Signup Form */}
        <div>
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white">Revision <span className="gradient-text">OS</span></h1>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
            <p className="text-dark-500 text-sm mb-6">Start your learning journey today</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Rinki"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="OGrinki@example.com"
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
                    placeholder="Min 6 characters"
                    className="input-field pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            level <= strength ? color : 'bg-dark-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${color?.replace('bg-', 'text-') || 'text-dark-500'}`}>
                      {label}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={strength < 2}
                className="w-full mt-2"
                size="lg"
              >
                Create Account <ArrowRight size={16} />
              </Button>
            </form>

            <p className="text-center text-dark-500 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
