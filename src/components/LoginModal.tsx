'use client';

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, LogIn, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Login va parol kiritilishi shart"); return; }
    setLoading(true);
    setError('');
    const res = await login(username, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Kirish amalga oshmadi');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070c17]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">MANUFACTURING ENTERPRISE HR</h1>
              <p className="text-indigo-200 text-sm mt-1">Tizimga Kirish — HR Xodimi Paneli</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Xavfsiz Kirish</label>
              </div>
              <p className="text-[11px] text-slate-500">Faqat vakolatli HR xodimlari kirishi mumkin</p>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Foydalanuvchi nomi</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="hr.admin"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Parol</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 pr-11 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-xs text-rose-300">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
            </button>

            <p className="text-center text-[11px] text-slate-600">
              Kirish muammosi bo'lsa Tizim Administratoriga murojaat qiling
            </p>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center space-y-1">
          <p className="text-[11px] text-amber-400 font-semibold">🔑 Demo Kirish Ma'lumotlari</p>
          <p className="text-[10px] text-amber-300/70 font-mono">admin / admin123 (SUPER_ADMIN)</p>
          <p className="text-[10px] text-slate-500">Haqiqiy tizimda bu ko'rsatilmaydi</p>
        </div>
      </div>
    </div>
  );
};
