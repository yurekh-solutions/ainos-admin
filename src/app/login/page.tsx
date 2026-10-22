'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#12121f] to-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AINOS Admin</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Sign in to access the admin panel</p>
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-xl border border-[hsl(var(--border))] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-[hsl(var(--border))] bg-[hsl(var(--background))] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  placeholder="admin@ainos.io"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-[hsl(var(--border))] bg-[hsl(var(--background))] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Dev credentials */}
          <div className="mt-6 p-4 bg-purple-950/30 border border-purple-800/40 rounded-lg">
            <p className="text-xs font-semibold text-purple-300 mb-2">Dev Credentials</p>
            <div className="space-y-1 text-xs text-purple-200/80">
              <p><span className="text-purple-400">Email:</span> yurekhsolutions@gmail.com</p>
              <p><span className="text-purple-400">Password:</span> admin123</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
              Admin access only. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}