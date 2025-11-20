
import React from 'react';
import { ChatSession, Persona, Language, Theme } from '../types';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { translations } from '../translations';

interface ChatListProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: () => void;
  personas: Map<string, Persona>;
  language: Language;
  theme: Theme;
}

export const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onCreateChat,
  personas,
  language,
  theme
}) => {
  const t = translations[language];
  
  const getAvatar = (chat: ChatSession) => {
    if (chat.isGroup) {
      const otherId = chat.participantIds.find(id => !personas.get(id)?.isUser) || chat.participantIds[0];
      return personas.get(otherId)?.avatar || "https://picsum.photos/200";
    } else {
      const otherId = chat.participantIds.find(id => !personas.get(id)?.isUser);
      return otherId ? personas.get(otherId)?.avatar : "https://picsum.photos/200";
    }
  };

  const sortedChats = [...chats].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  // Theme Styles
  const bgClass = theme === 'light' ? 'bg-[#e6e6e6]' : 'bg-[#2d2d2d]';
  const borderClass = theme === 'light' ? 'border-[#d6d6d6]' : 'border-[#3d3d3d]';
  const headerBgClass = theme === 'light' ? 'bg-[#f7f7f7]' : 'bg-[#333333]';
  const inputBgClass = theme === 'light' ? 'bg-[#e2e2e2]' : 'bg-[#262626]';
  const inputTextClass = theme === 'light' ? 'text-gray-900' : 'text-gray-200';
  const buttonBgClass = theme === 'light' ? 'bg-[#e2e2e2] hover:bg-[#d2d2d2]' : 'bg-[#444] hover:bg-[#555]';
  const itemHoverClass = theme === 'light' ? 'hover:bg-[#d9d9d9]' : 'hover:bg-[#3a3a3a]';
  const itemActiveClass = theme === 'light' ? 'bg-[#c5c5c6]' : 'bg-[#404040]';
  const textColorPrimary = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const textColorSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`w-[320px] ${bgClass} border-r ${borderClass} flex flex-col flex-shrink-0 transition-colors`}>
      {/* Header & Search */}
      <div className={`p-3 ${headerBgClass} border-b ${borderClass} flex flex-col gap-2 transition-colors`}>
        <div className="flex items-center justify-between">
           <span className={`text-xs ${textColorSecondary}`}>{t.app_name}</span>
           <button 
            onClick={onCreateChat}
            className={`p-1 ${buttonBgClass} rounded text-gray-500 transition-colors`}
            title={t.new_chat}
           >
             <Plus size={16} />
           </button>
        </div>
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={14} />
          </div>
          <input 
            type="text" 
            placeholder={t.search}
            className={`w-full ${inputBgClass} ${inputTextClass} text-xs py-1.5 pl-7 pr-2 rounded-[4px] focus:outline-none focus:bg-white dark:focus:bg-[#3a3a3a] border border-transparent focus:border-[#d6d6d6] transition-colors`}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sortedChats.length === 0 && (
            <div className={`p-4 text-center text-xs ${textColorSecondary}`}>{t.no_chats}</div>
        )}
        {sortedChats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isSelected = chat.id === activeChatId;
            
            return (
                <div 
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex items-center p-3 cursor-pointer select-none transition-colors ${isSelected ? itemActiveClass : itemHoverClass}`}
                >
                  <img 
                    src={getAvatar(chat)} 
                    className="w-12 h-12 rounded-[4px] object-cover"
                    alt="Avatar"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className={`text-sm font-medium truncate ${textColorPrimary}`}>{chat.name}</h3>
                        {lastMsg && (
                            <span className="text-[10px] text-gray-500">
                                {format(lastMsg.timestamp, 'HH:mm')}
                            </span>
                        )}
                    </div>
                    <p className={`text-xs truncate ${textColorSecondary}`}>
                        {lastMsg ? lastMsg.content : 'No messages'}
                    </p>
                  </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
