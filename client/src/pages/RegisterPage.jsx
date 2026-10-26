import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Building, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-editorial text-2xl font-semibold text-ink">Set up your talent workspace</h2>
        <p className="text-xs text-ink-muted mt-1">
          Create an enterprise hiring space with AI matching and Kanban pipelines.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Elena Rostova"
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Organization / Company Name</label>
          <div className="relative">
            <Building className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="organizationName"
              required
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Vanguard Technologies"
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="elena@vanguardtalent.io"
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
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-2.5 px-4 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Workspace...' : 'Create Workspace & Continue'}
          {!loading && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center">
        <p className="text-xs text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="text-forest-600 hover:text-forest-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
