'use client';

import React from 'react';
import {
  X,
  Megaphone,
  Calendar,
  User,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';

export interface AnnouncementType {
  id: string;
  title_uz: string;
  title_kr: string;
  content_uz: string;
  content_kr: string;
  category: 'FEATURE' | 'UPDATE' | 'MAINTENANCE' | 'IMPORTANT' | string;
  affectedModule: 'ALL' | 'KPI' | 'ATTENDANCE' | 'APPLICATIONS' | 'SAFETY' | 'HIERARCHY' | string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  created_at?: string;
  createdAt?: string;
  created_by?: string;
  is_published: boolean;
}

interface AnnouncementDetailModalProps {
  announcement: AnnouncementType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen || !announcement) return null;

  const title = language === 'kr' ? announcement.title_kr : announcement.title_uz;
  const content = language === 'kr' ? announcement.content_kr : announcement.content_uz;
  const dateStr = announcement.createdAt || announcement.created_at || new Date().toISOString();

  // Category badge rendering
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            {t('announcements.cat_feature', '🚀 Yangi Imkoniyat')}
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <RefreshCw className="h-3.5 w-3.5" />
            {t('announcements.cat_update', "🔄 Modul O'zgarishi")}
          </span>
        );
      case 'IMPORTANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('announcements.cat_important', '⚠️ Muhim E\'lon')}
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Wrench className="h-3.5 w-3.5" />
            {t('announcements.cat_maintenance', '🛠️ Texnik Ishlar')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            {category}
          </span>
        );
    }
  };

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case 'ALL': return language === 'kr' ? '전체 모듈' : "Barcha Modullar";
      case 'KPI': return 'KPI & Samaradorlik';
      case 'ATTENDANCE': return language === 'kr' ? '근태 및 휴가' : "Davomat & Ta'tillar";
      case 'APPLICATIONS': return language === 'kr' ? '신청 및 결재' : "Arizalar & Hujjatlar";
      case 'SAFETY': return language === 'kr' ? '보건 안전 (HSE)' : "Med-ko'rik & HSE";
      case 'HIERARCHY': return language === 'kr' ? '조직도' : "Ierarxiya & Org Chart";
      default: return mod;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('announcements.detail_title', "Tizim Yangilanishi Tafsilotlari")}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {t('announcements.title', "Tizim Yangilanishlari va E'lonlar Markazi")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
            {getCategoryBadge(announcement.category)}

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1 font-mono font-bold">
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
                {formatDate(dateStr)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {announcement.created_by || 'Admin'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
            {title}
          </h2>

          {/* Module Tag */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">{t('announcements.affected_module', 'Tegishli Modul')}:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-blue-800 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
              <Layers className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
              {getModuleLabel(announcement.affectedModule)}
            </span>
          </div>

          {/* Content */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700/60">
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
              {content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            {t('common.close', 'Yopish')}
          </button>
        </div>
      </div>
    </div>
  );
};
