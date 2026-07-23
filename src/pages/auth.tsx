import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, LogIn, Mail, Lock } from 'lucide-react';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Signup successful! Please check your email.');
      }
      navigate('/dashboard'); // Temporarily redirect to dashboard, should check if hostel exists later
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="glass p-8 rounded-2xl w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-4 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ZoloHostel
          </h1>
          <p className="text-text-muted mt-2">Manage your property efficiently</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-hover/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="admin@hostel.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-hover/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={(e) => handleAuth(e, 'login')}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={(e) => handleAuth(e, 'signup')}
              disabled={loading}
              className="flex-1 bg-surface-hover hover:bg-surface text-white font-medium py-2.5 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
