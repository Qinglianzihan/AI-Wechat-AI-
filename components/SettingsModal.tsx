import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, Save, Globe, Box, RefreshCw, CheckCircle, Edit2, List } from 'lucide-react';
import { fetchAvailableModels } from '../services/geminiService';
import { Language, Theme } from '../types';
import { translations } from '../translations';

interface SettingsModalProps {
  apiKey: string;
  baseURL: string;
  modelName: string;
  availableModels: string[];
  onUpdateModels: (models: string[]) => void;
  onSave: (key: string, url: string, model: string) => void;
  onClose: () => void;
  onResetData: () => void;
  language: Language;
  theme: Theme;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  apiKey, 
  baseURL, 
  modelName,
  availableModels,
  onUpdateModels,
  onSave, 
  onClose, 
  onResetData,
  language,
  theme
}) => {
  const t = translations[language];
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputUrl, setInputUrl] = useState(baseURL);
  const [inputModel, setInputModel] = useState(modelName);
  const [manualModelMode, setManualModelMode] = useState(availableModels.length === 0);
  
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');
  const [urlAutoCorrected, setUrlAutoCorrected] = useState(false);

  useEffect(() => {
    if (availableModels.length > 0 && !modelName) {
        setInputModel(availableModels[0]);
        setManualModelMode(false);
    }
  }, [availableModels, modelName]);

  const handleSave = () => {
    onSave(inputKey.trim(), inputUrl.trim(), inputModel.trim());
    onClose();
  };

  const handleReset = () => {
    if (confirm(t.reset_confirm)) {
      onResetData();
      onClose();
    }
  };

  const handleFetchModels = async () => {
    if (!inputUrl || !inputKey) return;
    setIsFetching(true);
    setFetchMsg('');
    setUrlAutoCorrected(false);
    
    try {
        const { models, activeBaseURL } = await fetchAvailableModels(inputUrl, inputKey);
        onUpdateModels(models);
        setFetchMsg(t.fetch_success);
        setManualModelMode(false);
        
        // Check if the service found a better URL than what the user typed
        if (activeBaseURL !== inputUrl) {
            setInputUrl(activeBaseURL);
            setUrlAutoCorrected(true);
        }

        if (models.length > 0) {
            // If current input is not in list, select first
            if (!models.includes(inputModel)) {
                 setInputModel(models[0]);
            }
        }
    } catch (e) {
        console.error(e);
        setFetchMsg(e instanceof Error ? e.message : t.fetch_error);
    } finally {
        setIsFetching(false);
    }
  };

  // Theme Styles
  const modalBg = theme === 'light' ? 'bg-white' : 'bg-[#222]';
  const textPrimary = theme === 'light' ? 'text-gray-800' : 'text-gray-100';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-gray-300';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-[#333]';
  const headerBg = theme === 'light' ? 'bg-gray-50' : 'bg-[#2a2a2a]';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-[#333]';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-[#444]';
  const inputText = theme === 'light' ? 'text-black' : 'text-white';
  const hintText = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${modalBg} w-[500px] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto transition-colors`}>
        <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBg} sticky top-0`}>
          <h3 className={`font-medium ${textPrimary}`}>{t.settings_title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Info */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            {t.provider_hint}
          </div>

          {/* Base URL */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium ${textSecondary} mb-2`}>
              <Globe size={16} /> {t.base_url}
            </label>
            <div className="relative">
                <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                    setInputUrl(e.target.value);
                    setUrlAutoCorrected(false);
                }}
                placeholder="https://api.newapi.pro/v1"
                className={`w-full p-2.5 border rounded text-sm focus:outline-none focus:border-[#07c160] font-mono ${inputBg} ${inputText} ${urlAutoCorrected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : inputBorder}`}
                />
                {urlAutoCorrected && (
                    <div className="absolute right-3 top-3 text-green-600" title="URL auto-corrected">
                        <CheckCircle size={16} />
                    </div>
                )}
            </div>
            <p className={`text-[10px] ${hintText} mt-1`}>
              {urlAutoCorrected ? "URL automatically updated to the correct endpoint." : t.base_url_desc}
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium ${textSecondary} mb-2`}>
              <Key size={16} /> {t.api_key}
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-..."
              className={`w-full p-2.5 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:outline-none focus:border-[#07c160] font-mono`}
            />
          </div>

          {/* Model Name */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${textSecondary}`}>
                <Box size={16} /> {t.model_name}
                </label>
                <div className="flex gap-3 items-center">
                    {availableModels.length > 0 && (
                        <button 
                            onClick={() => setManualModelMode(!manualModelMode)}
                            className={`text-xs flex items-center gap-1 ${hintText} hover:text-[#07c160]`}
                            title={manualModelMode ? t.switch_to_list : t.switch_to_manual}
                        >
                            {manualModelMode ? <List size={12} /> : <Edit2 size={12} />}
                        </button>
                    )}
                    <button 
                        onClick={handleFetchModels} 
                        disabled={isFetching || !inputKey || !inputUrl}
                        className="text-xs flex items-center gap-1 text-[#07c160] hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
                        {isFetching ? t.fetching : t.fetch_models}
                    </button>
                </div>
            </div>

            <div className="relative">
                {availableModels.length > 0 && !manualModelMode ? (
                    <select 
                        value={inputModel}
                        onChange={(e) => setInputModel(e.target.value)}
                        className={`w-full p-2.5 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:outline-none focus:border-[#07c160] appearance-none`}
                    >
                        {availableModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={inputModel}
                        onChange={(e) => setInputModel(e.target.value)}
                        placeholder="gemini-2.5-flash"
                        className={`w-full p-2.5 border ${inputBorder} ${inputBg} ${inputText} rounded text-sm focus:outline-none focus:border-[#07c160] font-mono`}
                    />
                )}
            </div>
            
            {fetchMsg && (
                <p className={`text-[10px] mt-1 ${fetchMsg.toLowerCase().includes('fail') || fetchMsg.toLowerCase().includes('error') ? 'text-red-500' : 'text-green-600'}`}>
                    {fetchMsg}
                </p>
            )}
            <p className={`text-[10px] ${hintText} mt-1`}>
              {t.model_name_desc}
            </p>
          </div>

          <hr className={theme === 'light' ? 'border-gray-100' : 'border-[#333]'} />

          {/* Danger Zone */}
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">{t.danger_zone}</h4>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded border border-red-200 dark:border-red-900/50 w-full justify-center transition-colors"
            >
              <Trash2 size={16} /> {t.reset_data}
            </button>
          </div>
        </div>

        <div className={`p-4 border-t ${borderClass} flex justify-end gap-2 ${headerBg} sticky bottom-0`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 text-sm ${hintText} hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded transition-colors`}
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 text-sm text-white bg-[#07c160] hover:bg-[#06ad56] rounded"
          >
            <Save size={16} /> {t.save_settings}
          </button>
        </div>
      </div>
    </div>
  );
};