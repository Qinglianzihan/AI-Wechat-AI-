
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Box, Globe, Key, RefreshCw, List, Edit2, UserPlus, Download, User, AlertTriangle } from 'lucide-react';
import { fetchAvailableModels } from '../services/geminiService';
import { AIConfig, Language, Theme, Persona, Message } from '../types';
import { translations } from '../translations';
import { format } from 'date-fns';

interface ChatSettingsModalProps {
  chatName: string;
  currentConfig: AIConfig | undefined;
  globalConfig: AIConfig;
  availableModels: string[];
  onSave: (config: AIConfig | undefined) => void;
  onClose: () => void;
  
  // Group Management
  currentMembers: string[];
  allPersonas: Map<string, Persona>;
  onInvite: (personaId: string) => void;
  onClearHistory: () => void;
  messages: Message[];

  language: Language;
  theme: Theme;
}

type Tab = 'settings' | 'members' | 'data';

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  chatName,
  currentConfig,
  globalConfig,
  availableModels,
  onSave,
  onClose,
  currentMembers,
  allPersonas,
  onInvite,
  onClearHistory,
  messages,
  language,
  theme
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  
  // Settings State
  const [useGlobal, setUseGlobal] = useState(!currentConfig);
  const [formData, setFormData] = useState<AIConfig>(currentConfig || globalConfig);
  const [manualModelMode, setManualModelMode] = useState(availableModels.length === 0);
  const [isFetching, setIsFetching] = useState(false);
  const [modelsList, setModelsList] = useState<string[]>(availableModels);

  // Invite State
  const [inviteId, setInviteId] = useState('');

  useEffect(() => {
    if (useGlobal) {
        setFormData(globalConfig);
    } else if (!currentConfig) {
        setFormData(globalConfig);
    }
  }, [useGlobal, globalConfig]);

  const handleSave = () => {
      onSave(useGlobal ? undefined : formData);
      onClose();
  };

  const handleFetchModels = async () => {
      if (!formData.baseURL || !formData.apiKey) return;
      setIsFetching(true);
      try {
          const { models } = await fetchAvailableModels(formData.baseURL, formData.apiKey);
          setModelsList(models);
          setManualModelMode(false);
          if (models.length > 0 && !models.includes(formData.model)) {
              setFormData(prev => ({...prev, model: models[0]}));
          }
      } catch (e) {
          console.error(e);
          alert(t.fetch_error);
      } finally {
          setIsFetching(false);
      }
  };

  const handleExportTXT = () => {
      const lines = messages.map(m => {
          const sender = allPersonas.get(m.senderId)?.name || "Unknown";
          const time = format(m.timestamp, 'yyyy-MM-dd HH:mm:ss');
          return `[${time}] ${sender}: ${m.content}`;
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chatName}_history.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Styles
  const modalBg = theme === 'light' ? 'bg-white' : 'bg-[#222]';
  const textPrimary = theme === 'light' ? 'text-gray-800' : 'text-gray-100';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-[#333]';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-[#444]';
  const inputText = theme === 'light' ? 'text-black' : 'text-white';
  const headerBg = theme === 'light' ? 'bg-gray-50' : 'bg-[#2a2a2a]';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-[#333]';

  const candidates = Array.from(allPersonas.values()).filter(p => !currentMembers.includes(p.id) && !p.isUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${modalBg} w-[500px] rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]`}>
        <div className={`p-4 border-b ${borderColor} ${headerBg} flex justify-between items-center shrink-0`}>
          <h3 className={`font-medium ${textPrimary}`}>{t.chat_settings_title}: {chatName}</h3>
          <button onClick={onClose}><X size={20} className={textSecondary} /></button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${borderColor} shrink-0`}>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === 'settings' ? 'border-[#07c160] text-[#07c160]' : `border-transparent ${textSecondary} hover:bg-gray-50 dark:hover:bg-[#2a2a2a]`}`}
            >
                {t.tab_settings}
            </button>
            <button 
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === 'members' ? 'border-[#07c160] text-[#07c160]' : `border-transparent ${textSecondary} hover:bg-gray-50 dark:hover:bg-[#2a2a2a]`}`}
            >
                {t.tab_members}
            </button>
            <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === 'data' ? 'border-[#07c160] text-[#07c160]' : `border-transparent ${textSecondary} hover:bg-gray-50 dark:hover:bg-[#2a2a2a]`}`}
            >
                {t.tab_data}
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="useGlobal"
                            checked={useGlobal}
                            onChange={(e) => setUseGlobal(e.target.checked)}
                            className="w-4 h-4 text-[#07c160] rounded focus:ring-[#07c160]"
                        />
                        <label htmlFor="useGlobal" className={`text-sm font-medium ${textPrimary} cursor-pointer select-none`}>
                            {t.use_global}
                        </label>
                    </div>

                    {!useGlobal && (
                        <div className="space-y-4 pl-1">
                            {/* Base URL */}
                            <div>
                                <label className={`flex items-center gap-2 text-xs font-medium ${textSecondary} mb-1`}>
                                    <Globe size={14} /> {t.base_url}
                                </label>
                                <input
                                    type="text"
                                    value={formData.baseURL}
                                    onChange={(e) => setFormData({...formData, baseURL: e.target.value})}
                                    className={`w-full p-2 border rounded text-xs font-mono ${inputBg} ${inputBorder} ${inputText}`}
                                />
                            </div>

                            {/* API Key */}
                            <div>
                                <label className={`flex items-center gap-2 text-xs font-medium ${textSecondary} mb-1`}>
                                    <Key size={14} /> {t.api_key}
                                </label>
                                <input
                                    type="password"
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                                    className={`w-full p-2 border rounded text-xs font-mono ${inputBg} ${inputBorder} ${inputText}`}
                                />
                            </div>

                            {/* Model */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className={`flex items-center gap-2 text-xs font-medium ${textSecondary}`}>
                                        <Box size={14} /> {t.model_name}
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={handleFetchModels} disabled={isFetching} className="text-xs text-[#07c160] flex items-center gap-1">
                                            <RefreshCw size={10} className={isFetching ? "animate-spin" : ""} /> {t.fetch_models}
                                        </button>
                                        <button onClick={() => setManualModelMode(!manualModelMode)} className={`text-xs ${textSecondary}`}>
                                            {manualModelMode ? <List size={12}/> : <Edit2 size={12}/>}
                                        </button>
                                    </div>
                                </div>
                                {manualModelMode || modelsList.length === 0 ? (
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                                        className={`w-full p-2 border rounded text-xs font-mono ${inputBg} ${inputBorder} ${inputText}`}
                                    />
                                ) : (
                                    <select
                                        value={formData.model}
                                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                                        className={`w-full p-2 border rounded text-xs ${inputBg} ${inputBorder} ${inputText}`}
                                    >
                                        {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: MEMBERS */}
            {activeTab === 'members' && (
                <div className="space-y-6">
                    {/* Invite Section */}
                    <div className={`p-4 rounded border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-[#2a2a2a]'}`}>
                        <label className={`block text-xs font-medium ${textSecondary} mb-2`}>{t.invite_member}</label>
                        <div className="flex gap-2">
                             <select 
                                value={inviteId}
                                onChange={(e) => setInviteId(e.target.value)}
                                className={`flex-1 p-2 border rounded text-xs ${inputBg} ${inputBorder} ${inputText}`}
                             >
                                 <option value="">{t.select_to_invite}</option>
                                 {candidates.map(p => (
                                     <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                             </select>
                             <button 
                                onClick={() => {
                                    if (inviteId) {
                                        onInvite(inviteId);
                                        setInviteId('');
                                    }
                                }}
                                disabled={!inviteId}
                                className={`px-3 py-2 bg-[#07c160] text-white rounded text-xs hover:bg-[#06ad56] disabled:opacity-50`}
                             >
                                 {t.invite_btn}
                             </button>
                        </div>
                    </div>

                    {/* List Members */}
                    <div>
                        <label className={`block text-xs font-medium ${textSecondary} mb-2`}>Current Members ({currentMembers.length})</label>
                        <div className={`border rounded ${borderColor} overflow-hidden`}>
                            {currentMembers.map(id => {
                                const p = allPersonas.get(id);
                                if (!p) return null;
                                return (
                                    <div key={id} className={`flex items-center p-2 gap-3 border-b ${borderColor} last:border-0 ${inputBg}`}>
                                        <img src={p.avatar} className="w-8 h-8 rounded bg-gray-200" />
                                        <div className="flex-1">
                                            <div className={`text-sm font-medium ${textPrimary}`}>{p.name} {p.isUser && '(You)'}</div>
                                            <div className="text-[10px] text-gray-400">{p.description}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: DATA */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                     <div className={`p-4 border rounded ${borderColor} ${inputBg} flex items-center justify-between`}>
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-100 text-blue-600 rounded dark:bg-blue-900 dark:text-blue-200">
                                 <Download size={20} />
                             </div>
                             <div>
                                 <div className={`text-sm font-medium ${textPrimary}`}>Export Chat History</div>
                                 <div className="text-xs text-gray-500">Save as .txt file</div>
                             </div>
                         </div>
                         <button 
                            onClick={handleExportTXT}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 dark:border-[#555] dark:hover:bg-[#3a3a3a] transition-colors"
                         >
                             {t.export_txt}
                         </button>
                     </div>

                     <div className={`p-4 border rounded border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 flex flex-col gap-3`}>
                         <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                             <AlertTriangle size={18} />
                             <span className="text-sm font-medium">{t.danger_zone}</span>
                         </div>
                         <p className="text-xs text-red-500/80 dark:text-red-400/80">
                             {t.clear_confirm}
                         </p>
                         <button 
                            onClick={() => {
                                if(confirm(t.clear_confirm)) {
                                    onClearHistory();
                                    onClose();
                                }
                            }}
                            className="self-start px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                         >
                             {t.clear_history}
                         </button>
                     </div>
                </div>
            )}
        </div>

        {activeTab === 'settings' && (
            <div className={`p-4 border-t ${borderColor} ${headerBg} flex justify-end gap-2 shrink-0`}>
                <button onClick={onClose} className={`px-4 py-2 text-sm rounded hover:bg-gray-200 dark:hover:bg-[#3a3a3a] ${textSecondary}`}>{t.cancel}</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#07c160] text-white rounded hover:bg-[#06ad56]">{t.save_settings}</button>
            </div>
        )}
        {activeTab !== 'settings' && (
             <div className={`p-4 border-t ${borderColor} ${headerBg} flex justify-end gap-2 shrink-0`}>
                 <button onClick={onClose} className={`px-4 py-2 text-sm rounded bg-gray-200 dark:bg-[#3a3a3a] ${textPrimary}`}>Close</button>
             </div>
        )}
      </div>
    </div>
  );
};
