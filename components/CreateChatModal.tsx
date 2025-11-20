import React, { useState } from 'react';
import { Persona, Language, Theme } from '../types';
import { X } from 'lucide-react';
import { translations } from '../translations';

interface CreateChatModalProps {
  personas: Map<string, Persona>;
  onClose: () => void;
  onCreate: (name: string, participantIds: string[]) => void;
  language: Language;
  theme: Theme;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ personas, onClose, onCreate, language, theme }) => {
  const t = translations[language];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [chatName, setChatName] = useState('');

  const personaList = Array.from(personas.values()).filter(p => !p.isUser);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = () => {
    if (selectedIds.size === 0) return;
    
    // Logic for naming: if no name provided, auto-generate from participants
    let finalName = chatName;
    if (!finalName) {
      const names = Array.from(selectedIds).map(id => personas.get(id)?.name).slice(0, 3);
      finalName = names.join(', ') + (selectedIds.size > 3 ? '...' : '');
    }
    
    onCreate(finalName, Array.from(selectedIds));
  };

  // Theme styles
  const modalBg = theme === 'light' ? 'bg-white' : 'bg-[#222]';
  const textPrimary = theme === 'light' ? 'text-black' : 'text-white';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-[#333]';
  const headerBg = theme === 'light' ? 'bg-gray-50' : 'bg-[#2a2a2a]';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-[#333]';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-[#444]';
  const inputText = theme === 'light' ? 'text-black' : 'text-white';
  const itemHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#333]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`${modalBg} w-[500px] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] transition-colors`}>
        <div className={`p-4 border-b ${borderClass} flex justify-between items-center`}>
          <h3 className={`font-medium ${textPrimary}`}>{t.start_group_chat}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className={`p-4 border-b ${borderClass} ${headerBg}`}>
            <input
                type="text"
                placeholder={t.group_name_placeholder}
                className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:outline-none focus:border-[#07c160]`}
                value={chatName}
                onChange={e => setChatName(e.target.value)}
            />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            <div className="text-xs text-gray-400 px-2 py-1">{t.select_participants}</div>
            {personaList.map(p => (
                <div 
                    key={p.id}
                    onClick={() => toggleSelection(p.id)}
                    className={`flex items-center p-2 ${itemHover} rounded cursor-pointer transition-colors`}
                >
                    <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-[#07c160] border-[#07c160]' : 'border-gray-400'}`}>
                        {selectedIds.has(p.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <img src={p.avatar} className="w-8 h-8 rounded" alt=""/>
                    <div className={`ml-3 text-sm font-medium ${textPrimary}`}>{p.name}</div>
                </div>
            ))}
        </div>

        <div className={`p-4 border-t ${borderClass} flex justify-end gap-2 ${headerBg}`}>
            <button 
                onClick={onClose}
                className={`px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-[#3a3a3a] rounded transition-colors`}
            >
                {t.cancel}
            </button>
            <button 
                onClick={handleCreate}
                disabled={selectedIds.size === 0}
                className={`px-4 py-2 text-sm text-white rounded ${selectedIds.size === 0 ? 'bg-gray-300 dark:bg-[#444]' : 'bg-[#07c160] hover:bg-[#06ad56]'}`}
            >
                {t.start_chat_btn} ({selectedIds.size})
            </button>
        </div>
      </div>
    </div>
  );
};