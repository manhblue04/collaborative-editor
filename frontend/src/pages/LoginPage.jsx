import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../components/common/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register, loading, error, clearError } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success;

    if (isRegister) {
      success = await register(form.name, form.email, form.password);
      if (success) {
        toast.success('Account created! Signing in...');
        success = await login(form.email, form.password);
      }
    } else {
      success = await login(form.email, form.password);
    }

    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold text-2xl shadow-xl shadow-primary-500/25">
            CE
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CollabEdit</h1>
          <p className="mt-2 text-sm text-blue-200/70">
            Real-time collaborative document editing
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/10">
          <h2 className="mb-6 text-xl font-semibold text-white">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-blue-100/70 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-blue-200/30 shadow-sm transition-colors focus:border-primary-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-blue-100/70 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-blue-200/30 shadow-sm transition-colors focus:border-primary-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100/70 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-blue-200/30 shadow-sm transition-colors focus:border-primary-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:from-primary-500 hover:to-indigo-500 hover:shadow-primary-600/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
              className="text-sm text-blue-300/80 hover:text-blue-200 font-medium transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-blue-300/30">
          Powered by Yjs CRDT & WebSocket
        </p>
      </div>
    </div>
  );
}
