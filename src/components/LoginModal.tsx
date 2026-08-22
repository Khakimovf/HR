'use client';

import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  LogIn,
  Building2,
  AlertTriangle,
  Loader2,
  User,
  Lock,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface LoginModalProps {
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen }) => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [rememberMe, setRememberMe]   = useState(true);
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [forgotAlert, setForgotAlert] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('login.error_required', 'Login va parol kiritilishi shart'));
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || t('login.error_failed', 'Kirish amalga oshmadi'));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
      {/* ── Background Ambient Mesh Glow ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Top-Right Header Utility Controls ── */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        {/* Language Toggle Pill [🇺🇿 UZ / 🇰🇷 KR] */}
        <div className="flex items-center rounded-xl bg-slate-900/80 backdrop-blur-md p-1 border border-slate-800 shadow-xl">
          <button
            type="button"
            onClick={() => setLanguage('uz')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              language === 'uz'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇺🇿 UZ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kr')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              language === 'kr'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇰🇷 KR
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition shadow-xl cursor-pointer"
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-200" />}
        </button>
      </div>

      {/* ── Central Glassmorphism Login Card ── */}
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl shadow-blue-950/40 rounded-3xl p-8 space-y-6">
          {/* Branding Header */}
          <div className="text-center">
            {/* Top Sub-Badge: UZ DONG YANG */}
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mx-auto w-fit mb-3 block text-center shadow-sm">
              {t('login.brand_sub_badge', '🏢 UZ DONG YANG')}
            </span>

            {/* Main System Title: HR-MATRIX */}
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-400 text-center">
              {t('login.matrix_title', 'HR-MATRIX')}
            </h1>

            {/* Tagline */}
            <p className="text-xs font-medium text-slate-400 text-center block mt-1.5">
              {t('login.matrix_tagline', 'Enterprise HR Analitika va Boshqaruv Platformasi')}
            </p>
          </div>

          {/* Form Input Fields & Controls */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabel № / Login Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {t('login.username', 'Tabel № / Login')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder={t('login.username_placeholder', 'Tabel № (masalan: TB-1000 yoki Admin)')}
                  autoComplete="username"
                  className="w-full bg-slate-800/80 text-white border border-slate-700/80 rounded-xl pl-9 pr-4 py-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500 font-semibold"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {t('login.password', 'Parol')} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-800/80 text-white border border-slate-700/80 rounded-xl pl-9 pr-10 py-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Security Badge Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span>{t('login.rememberMe', 'Sessiyani saqlash')}</span>
              </label>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>256-bit Encrypted</span>
              </span>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800 p-3 text-xs text-rose-300 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span>{loading ? t('login.submitting', 'Tekshirilmoqda...') : t('login.submit', 'TIZIMGA KIRISH')}</span>
            </button>
          </form>

          {/* Demo Credentials Helper Card */}
          <div className="border-t border-slate-800/80 pt-4 text-center space-y-1 text-xs">
            <p className="text-amber-400 font-bold flex items-center justify-center gap-1 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>🔑 Demo Kirish Ma'lumotlari (Credentials)</span>
            </p>
            <p className="text-slate-300 font-mono text-[11px]">
              Login: <span className="text-blue-400 font-bold">admin</span> | Parol: <span className="text-blue-400 font-bold">admin123</span>
            </p>
            <p className="text-[10px] text-slate-500">
              DB foydalanuvchilari (seed-admin) orqali kirish. API endi autentifikatsiyasiz ochiq emas.
            </p>
          </div>

          {/* Footer Copyright Notice */}
          <div className="pt-2 text-center border-t border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-mono">
              © 2026 Uz Dong Yang. All Rights Reserved. HR-MATRIX v2.4 Enterprise Edition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
