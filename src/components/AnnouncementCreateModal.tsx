'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Check,
  Loader2,
  FileText,
  Globe,
  Tag,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnnouncementType } from './AnnouncementDetailModal';

interface AnnouncementCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAnnouncement?: AnnouncementType | null;
}

export const AnnouncementCreateModal: React.FC<AnnouncementCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingAnnouncement,
}) => {
  const { t, language } = useLanguage();

  const [titleUz, setTitleUz]             = useState('');
  const [titleKr, setTitleKr]             = useState('');
  const [contentUz, setContentUz]         = useState('');
  const [contentKr, setContentKr]         = useState('');
  const [category, setCategory]           = useState('UPDATE');
  const [affectedModule, setAffectedModule] = useState('ALL');
  const [priority, setPriority]           = useState('MEDIUM');
  const [isPublished, setIsPublished]     = useState(true);

  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (editingAnnouncement) {
      setTitleUz(editingAnnouncement.title_uz || '');
      setTitleKr(editingAnnouncement.title_kr || '');
      setContentUz(editingAnnouncement.content_uz || '');
      setContentKr(editingAnnouncement.content_kr || '');
      setCategory(editingAnnouncement.category || 'UPDATE');
      setAffectedModule(editingAnnouncement.affectedModule || 'ALL');
      setPriority(editingAnnouncement.priority || 'MEDIUM');
      setIsPublished(editingAnnouncement.is_published ?? true);
    } else {
      resetForm();
    }
  }, [editingAnnouncement, isOpen]);

  const resetForm = () => {
    setTitleUz('');
    setTitleKr('');
    setContentUz('');
    setContentKr('');
    setCategory('UPDATE');
    setAffectedModule('ALL');
    setPriority('MEDIUM');
    setIsPublished(true);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!titleUz.trim() || !titleKr.trim() || !contentUz.trim() || !contentKr.trim()) {
      setError(language === 'kr' ? '우즈베크어 및 한국어 제목과 내용을 모두 입력하세요.' : "Barcha sarlavha va mazmun maydonlarini to'ldiring (UZ/KR)");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const url = editingAnnouncement ? `/api/announcements/${editingAnnouncement.id}` : '/api/announcements';
      const method = editingAnnouncement ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_uz: titleUz,
          title_kr: titleKr,
          content_uz: contentUz,
          content_kr: contentKr,
          category,
          affectedModule,
          priority,
          is_published: isPublished,
          created_by: 'Admin HR',
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        handleClose();
      } else {
        setError(data.error || (language === 'kr' ? '저장 실패' : "Saqlashda xatolik"));
      }
    } catch {
      setError(language === 'kr' ? '네트워크 오류가 발생했습니다.' : "Tarmoq xatoligi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingAnnouncement ? (language === 'kr' ? '공지사항 수정' : "E'lonni Tahrirlash") : t('announcements.add_new', "+ Yangi E'lon Qo'shish")}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {t('announcements.title', "Tizim Yangilanishlari va E'lonlar Markazi")}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Category & Affected Module & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {language === 'kr' ? '공지 카테고리' : 'Kategoriya'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="FEATURE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🚀 {t('announcements.cat_feature', 'Yangi Imkoniyat')}</option>
                <option value="UPDATE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🔄 {t('announcements.cat_update', "Modul O'zgarishi")}</option>
                <option value="IMPORTANT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">⚠️ {t('announcements.cat_important', 'Muhim E\'lon')}</option>
                <option value="MAINTENANCE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🛠️ {t('announcements.cat_maintenance', 'Texnik Ishlar')}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('announcements.affected_module', 'Tegishli Modul')}
              </label>
              <select
                value={affectedModule}
                onChange={(e) => setAffectedModule(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '전체 모듈' : "Barcha Modullar"}</option>
                <option value="KPI" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">KPI & Samaradorlik</option>
                <option value="ATTENDANCE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '근태 및 휴가' : "Davomat & Ta'tillar"}</option>
                <option value="APPLICATIONS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '신청 및 결재' : "Arizalar & Hujjatlar"}</option>
                <option value="SAFETY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '보건 안전 (HSE)' : "Med-ko'rik & HSE"}</option>
                <option value="HIERARCHY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '조직도' : "Ierarxiya & Org Chart"}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {language === 'kr' ? '우선순위' : 'Ustuvorlik'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="HIGH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🔴 High (Yuqori)</option>
                <option value="MEDIUM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🟡 Medium (O'rta)</option>
                <option value="LOW" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">🟢 Low (Past)</option>
              </select>
            </div>
          </div>

          {/* Titles in UZ and KR */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('announcements.title_uz', "E'lon Sarlavhasi (Uzbek)")} *
              </label>
              <input
                value={titleUz}
                onChange={(e) => setTitleUz(e.target.value)}
                placeholder="Misol: V2.4 Yangi Med-ko'rik moduli ishga tushirildi"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('announcements.title_kr', "E'lon Sarlavhasi (Koreys)")} *
              </label>
              <input
                value={titleKr}
                onChange={(e) => setTitleKr(e.target.value)}
                placeholder="예시: V2.4 보건 안전 (HSE) 자동화 모듈 출시"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Contents in UZ and KR */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('announcements.content', "E'lon Mazmuni")} (Uzbek) *
              </label>
              <textarea
                rows={3}
                value={contentUz}
                onChange={(e) => setContentUz(e.target.value)}
                placeholder="Batafsil ma'lumot va ko'rsatmalar..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('announcements.content', "E'lon Mazmuni")} (Korean) *
              </label>
              <textarea
                rows={3}
                value={contentKr}
                onChange={(e) => setContentKr(e.target.value)}
                placeholder="상세 내용을 입력하세요..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Toggle Switch: Publish Immediately */}
          <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'kr' ? '즉시 게시 및 대시보드 연동' : 'Darhol Chop Etish (Dashboard Direct Sync)'}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {language === 'kr' ? '활성화 시 메인 대시보드 배너에 바로 표시됩니다.' : 'Yoqilsa barcha foydalanuvchilar dashboardida ko\'rinadi.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublished ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 p-3 text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={handleClose}
            className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {t('common.cancel', 'Bekor qilish')}
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-sm disabled:opacity-40 transition active:scale-95 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('common.save', 'Saqlash')}
          </button>
        </div>
      </div>
    </div>
  );
};
