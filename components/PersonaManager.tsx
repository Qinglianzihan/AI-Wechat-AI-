
import React, { useState, useEffect } from 'react';
import { Persona, Language, Theme } from '../types';
import { Plus, User, Trash2, Save, Box, MessageCircle } from 'lucide-react';
import { translations } from '../translations';

interface PersonaManagerProps {
  personas: Map<string, Persona>;
  onAddPersona: (p: Persona) => void;
  onDeletePersona: (id: string) => void;
  onStartDirectChat: (personaId: string) => void; // New Prop
  availableModels?: string[];
  language: Language;
  theme: Theme;
}

export const PersonaManager: React.FC<PersonaManagerProps> = ({ 
  personas, 
  onAddPersona, 
  onDeletePersona, 
  onStartDirectChat,
  availableModels = [],
  language, 
  theme 
}) => {
  const t = translations[language];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    instruction: '',
    model: ''
  });

  const handleInitCreate = () => {
    setEditingId(null);
    setFormData({ name: '', role: '', instruction: '', model: '' });
  };

  const handleSelectPersona = (p: Persona) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      role: p.description,
      instruction: p.systemInstruction,
      model: p.model || ''
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.instruction) return;

    const newPersona: Persona = {
      id: editingId || `ai-${Date.now()}`,
      name: formData.name,
      avatar: editingId && personas.get(editingId)?.avatar ? personas.get(editingId)!.avatar : `https://picsum.photos/seed/${formData.name}/200/200`,
      description: formData.role || "AI Character",
      systemInstruction: formData.instruction,
      isUser: false,
      model: formData.model || undefined
    };

    onAddPersona(newPersona);
    
    if (!editingId) {
        setFormData({ name: '', role: '', instruction: '', model: '' });
    } else {
        setEditingId(null);
        setFormData({ name: '', role: '', instruction: '', model: '' });
    }
  };

  const personaList = Array.from(personas.values()).filter(p => !p.isUser);

  // Styles
  const mainBg = theme === 'light' ? 'bg-[#f5f5f5]' : 'bg-[#121212]';
  const listBg = theme === 'light' ? 'bg-white' : 'bg-[#2d2d2d]';
  const borderClass = theme === 'light' ? 'border-[#d6d6d6]' : 'border-[#333]';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const textSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const itemHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#3a3a3a]';
  const itemActive = theme === 'light' ? 'bg-gray-200' : 'bg-[#404040]';
  
  const formBg = theme === 'light' ? 'bg-white' : 'bg-[#2d2d2d]';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-[#444]';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-[#333]';
  const inputText = theme === 'light' ? 'text-gray-900' : 'text-gray-100';

  return (
    <div className={`flex-1 flex ${mainBg} h-full transition-colors`}>
      <div className={`w-[320px] ${listBg} border-r ${borderClass} overflow-y-auto flex flex-col`}>
        <div className={`p-4 border-b ${borderClass} flex justify-between items-center`}>
          <h2 className={`text-lg font-medium ${textPrimary}`}>{t.contacts_title}</h2>
          <button 
            onClick={handleInitCreate}
            className="flex items-center gap-1 text-xs bg-[#07c160] text-white px-2 py-1 rounded"
          >
            <Plus size={14} /> {t.new_ai}
          </button>
        </div>
        
        <div className="p-2">
          <div className="text-xs text-gray-400 px-2 mb-2 font-medium">{t.ai_characters}</div>
          {personaList.map(p => (
            <div 
                key={p.id} 
                onClick={() => handleSelectPersona(p)}
                className={`flex items-center p-3 cursor-pointer rounded-[4px] group transition-colors ${editingId === p.id ? itemActive : itemHover}`}
            >
              <img src={p.avatar} className="w-9 h-9 rounded bg-gray-200 object-cover" alt="" />
              <div className="ml-3 flex-1 min-w-0">
                <div className={`text-sm font-medium ${textPrimary}`}>{p.name}</div>
                <div className={`text-xs ${textSecondary} truncate`}>{p.description}</div>
                {p.model && (
                    <div className="text-[10px] text-[#07c160] truncate mt-0.5">
                        {p.model}
                    </div>
                )}
              </div>
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDeletePersona(p.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Creation/Detail Panel */}
      <div className={`flex-1 flex items-center justify-center ${mainBg}`}>
        <div className={`${formBg} p-8 rounded-lg shadow-sm w-[400px] transition-colors`}>
        
        {/* Profile Header */}
        <div className="flex justify-between items-start mb-6">
            <h3 className={`text-xl font-medium ${textPrimary}`}>
                {editingId ? `Edit: ${formData.name}` : t.create_persona_title}
            </h3>
            {editingId && (
                <button 
                    onClick={() => onStartDirectChat(editingId)}
                    className="flex items-center gap-2 bg-[#07c160] text-white px-3 py-1.5 rounded text-xs hover:bg-[#06ad56] shadow-sm"
                >
                    <MessageCircle size={14} />
                    {t.send_message}
                </button>
            )}
        </div>
        
        <div className="space-y-4">
            {/* Name */}
            <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.name_label}</label>
            <input 
                type="text" 
                className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:border-[#07c160] focus:outline-none`}
                placeholder={t.name_placeholder}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
            />
            </div>

            {/* Role */}
            <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.role_label}</label>
            <input 
                type="text" 
                className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:border-[#07c160] focus:outline-none`}
                placeholder={t.role_placeholder}
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
            />
            </div>

            {/* Instruction */}
            <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t.instruction_label}</label>
            <textarea 
                className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm h-32 resize-none focus:border-[#07c160] focus:outline-none`}
                placeholder={t.instruction_placeholder}
                value={formData.instruction}
                onChange={e => setFormData({...formData, instruction: e.target.value})}
            />
            <p className="text-[10px] text-gray-400 mt-1">{t.instruction_hint}</p>
            </div>

            {/* Model Selection */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Box size={12}/> {t.model_label}
                </label>
                <select 
                    className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:border-[#07c160] focus:outline-none appearance-none`}
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                >
                    <option value="">{t.model_default}</option>
                    {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
            {editingId && (
                <button 
                    onClick={handleInitCreate}
                    className={`flex-1 py-2 text-sm ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700 rounded`}
                >
                    {t.cancel}
                </button>
            )}
            <button 
                onClick={handleSave}
                className="flex-1 py-2 text-sm bg-[#07c160] text-white rounded hover:bg-[#06ad56] flex justify-center gap-2 items-center"
            >
                {editingId ? <Save size={14}/> : <Plus size={14}/>}
                {editingId ? t.update : t.create}
            </button>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};
