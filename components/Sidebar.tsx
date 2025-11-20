
import React from 'react';
import { MessageCircle, Users, Settings, Sun, Moon } from 'lucide-react';
import { AppView, Persona, Language, Theme } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: Persona;
  onOpenSettings: () => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  user, 
  onOpenSettings,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme
}) => {
  const t = translations[language];
  const bgClass = theme === 'light' ? 'bg-[#2e2e2e]' : 'bg-[#1a1a1a]';

  return (
    <div className={`w-[72px] ${bgClass} flex flex-col items-center py-4 flex-shrink-0 transition-colors`}>
      {/* User Avatar */}
      <div className="mb-6">
        <img 
          src={user.avatar} 
          alt="Me" 
          className="w-10 h-10 rounded-[4px] border border-gray-600"
        />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-6 w-full items-center">
        <button 
          onClick={() => onChangeView(AppView.CHAT)}
          className={`p-2.5 rounded hover:bg-white/10 transition-colors ${currentView === AppView.CHAT ? 'text-[#07c160]' : 'text-[#989898]'}`}
          title={t.chats}
        >
          <MessageCircle size={24} fill={currentView === AppView.CHAT ? "currentColor" : "none"} />
        </button>
        
        <button 
          onClick={() => onChangeView(AppView.CONTACTS)}
          className={`p-2.5 rounded hover:bg-white/10 transition-colors ${currentView === AppView.CONTACTS ? 'text-[#07c160]' : 'text-[#989898]'}`}
          title={t.contacts}
        >
          <Users size={24} fill={currentView === AppView.CONTACTS ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4 items-center w-full">
        <button 
          onClick={onToggleTheme}
          className="text-[#989898] hover:text-white p-2"
          title={theme === 'light' ? t.theme_dark : t.theme_light}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button 
          onClick={onToggleLanguage}
          className="text-[#989898] hover:text-white p-2 text-xs font-medium border border-transparent hover:border-gray-600 rounded"
          title="Switch Language"
        >
          {language === 'zh' ? 'En' : '中'}
        </button>

        <div className="text-[#989898] hover:text-white cursor-pointer p-2 pb-4" onClick={onOpenSettings} title={t.settings}>
          <Settings size={22} />
        </div>
      </div>
    </div>
  );
};
