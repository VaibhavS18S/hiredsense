import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('recruiter@hiresense.ai');
    setPassword('Password123!');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-editorial text-2xl font-semibold text-ink">Sign in to your workspace</h2>
        <p className="text-xs text-ink-muted mt-1">
          Access your talent pipeline, screening results, and candidate analytics.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Demo Credentials Quick-Fill Banner */}
      <div className="mb-5 p-3 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-forest-600" />
          <div className="text-xs">
            <span className="font-semibold text-ink">Demo Recruiter Account</span>
            <p className="text-[11px] text-ink-muted">recruiter@hiresense.ai</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDemoFill}
          className="text-xs px-2.5 py-1 rounded bg-white border border-sage-300 text-forest-700 font-medium hover:bg-forest-50 transition-colors"
        >
          Auto-fill
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In to HireSense'}
          {!loading && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center">
        <p className="text-xs text-ink-muted">
          Don't have an organization workspace?{' '}
          <Link to="/register" className="text-forest-600 hover:text-forest-700 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
