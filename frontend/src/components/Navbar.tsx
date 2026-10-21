import React from 'react';
import { Compass, Sparkles, Bookmark, Globe, ShieldCheck } from 'lucide-react';
import { useTranslation, LanguageCode } from '../i18n/LanguageContext';

interface NavbarProps {
  onOpenAssistant: () => void;
  onOpenSaved: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant, onOpenSaved, savedCount }) => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-step-600 via-step-500 to-tealbrand-500 flex items-center justify-center text-white shadow-3d-btn transform hover:rotate-6 transition-transform">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-step-700 via-step-600 to-tealbrand-600 bg-clip-text text-transparent">
                ThenStep
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" />
                All-India Free
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden md:block">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Assistant Quick Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-step-50 to-teal-50 border border-step-200 text-step-700 hover:border-step-300 font-semibold text-xs sm:text-sm transition-all shadow-xs hover:shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-step-600 animate-spin-slow" />
            <span className="hidden sm:inline">{t('nav.aiAssistant')}</span>
            <span className="sm:hidden">AI Assistant</span>
          </button>

          {/* Saved Trips */}
          <button
            onClick={onOpenSaved}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs sm:text-sm transition-all relative"
            title={t('nav.savedTrips')}
          >
            <Bookmark className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t('nav.savedTrips')}</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-step-600 text-white rounded-full text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent pl-1 pr-2 py-1 text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
