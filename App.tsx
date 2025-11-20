
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { PersonaManager } from './components/PersonaManager';
import { CreateChatModal } from './components/CreateChatModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatSettingsModal } from './components/ChatSettingsModal';
import { AppView, ChatSession, Message, Persona, Language, Theme, AIConfig } from './types';
import { INITIAL_PERSONAS, HUMAN_ID } from './constants';
import { generatePersonaReply, determineNextSpeaker } from './services/geminiService';

const STORAGE_KEYS = {
  PERSONAS: 'ai_wechat_personas',
  CHATS: 'ai_wechat_chats',
  API_KEY: 'ai_wechat_api_key',
  BASE_URL: 'ai_wechat_base_url',
  MODEL_NAME: 'ai_wechat_model_name',
  LANGUAGE: 'ai_wechat_language',
  THEME: 'ai_wechat_theme',
  AVAILABLE_MODELS: 'ai_wechat_available_models'
};

export default function App() {
  // --- Data State ---
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language) || 'zh';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'light';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  });

  const [baseURL, setBaseURL] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.BASE_URL) || 'https://api.newapi.pro/v1';
  });

  const [modelName, setModelName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MODEL_NAME) || 'gpt-3.5-turbo';
  });

  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVAILABLE_MODELS);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [view, setView] = useState<AppView>(AppView.CHAT);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [personas, setPersonas] = useState<Map<string, Persona>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Map(parsed);
      } catch (e) {
        console.error("Failed to load personas", e);
      }
    }
    // Fallback
    const map = new Map();
    INITIAL_PERSONAS.forEach(p => map.set(p.id, p));
    return map;
  });

  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    }
    return [
      {
          id: 'chat-demo',
          name: '跨时空对话',
          participantIds: ['user-me', 'ai-luxun', 'ai-libai', 'ai-musk'],
          messages: [
              { id: 'm1', senderId: 'ai-luxun', content: '愿中国青年都摆脱冷气，只是向上走，不必听自暴自弃者流的话。', timestamp: Date.now() - 100000 },
              { id: 'm2', senderId: 'ai-libai', content: '人生得意须尽欢，莫使金樽空对月！先生何必如此严肃？', timestamp: Date.now() - 90000 },
          ],
          isGroup: true,
          lastMessageAt: Date.now()
      }
    ];
  });
  
  const [activeChatId, setActiveChatId] = useState<string | null>('chat-demo');
  
  // AI Logic State
  const [autoChatStatus, setAutoChatStatus] = useState<Record<string, boolean>>({});
  const processingRef = useRef<boolean>(false);
  const [typingPersonaId, setTypingPersonaId] = useState<string | null>(null);
  // NEW: Track WHICH chat is currently typing to avoid cross-talk ghosts
  const [typingChatId, setTypingChatId] = useState<string | null>(null);

  // --- Persistence ---

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(Array.from(personas.entries())));
  }, [personas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BASE_URL, baseURL);
  }, [baseURL]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL_NAME, modelName);
  }, [modelName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.body.style.backgroundColor = theme === 'light' ? '#e5e5e5' : '#121212';
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_MODELS, JSON.stringify(availableModels));
  }, [availableModels]);

  // --- Helpers ---
  const currentUser = personas.get(HUMAN_ID) || INITIAL_PERSONAS[0];
  const activeChat = chats.find(c => c.id === activeChatId);

  const getEffectiveConfig = useCallback((chatConfig?: AIConfig): AIConfig => {
    return {
      apiKey: chatConfig?.apiKey || apiKey,
      baseURL: chatConfig?.baseURL || baseURL,
      model: chatConfig?.model || modelName
    };
  }, [apiKey, baseURL, modelName]);

  const updateChatMessages = (chatId: string, newMessage: Message) => {
    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessageAt: newMessage.timestamp
            };
        }
        return c;
    }));
  };

  // --- AI Loop with Moderator ---

  // This function is reusable for both auto-loop and manual trigger
  const triggerAIGeneration = async (targetChatId: string, isManualTrigger: boolean = false) => {
    if (processingRef.current) return;

    const chatSession = chats.find(c => c.id === targetChatId);
    if (!chatSession) return;
    
    const chatConfig = getEffectiveConfig(chatSession.config);
    if (!chatConfig.apiKey) return;

    const lastMsg = chatSession.messages[chatSession.messages.length - 1];
    const isAuto = autoChatStatus[chatSession.id];
    
    // Guard: If not auto and not manual, and last message wasn't human, do nothing.
    // (Unless we want AI to respond to AI in non-auto mode, but usually we don't unless auto is on)
    if (!isAuto && !isManualTrigger && lastMsg.senderId !== HUMAN_ID) return;
    
    const potentialResponders = chatSession.participantIds
        .filter(id => id !== HUMAN_ID && id !== lastMsg.senderId);
    
    if (potentialResponders.length === 0) return;

    // --- Decision Logic ---
    let responderId: string | null = null;
    
    // 1. Check for mentions
    const mentionedPersona = potentialResponders.find(id => {
        const p = personas.get(id);
        if (!p) return false;
        const content = lastMsg.content.toLowerCase();
        const name = p.name.toLowerCase();
        const firstName = name.split(' ')[0]; 
        return content.includes(name) || content.includes(`@${firstName}`) || content.includes(firstName);
    });

    if (mentionedPersona) {
        responderId = mentionedPersona;
    } else {
        // 2. Moderator (if auto or manual trigger)
        if (isAuto || isManualTrigger) {
            processingRef.current = true; 
            try {
               const participants = chatSession.participantIds
                    .map(id => personas.get(id))
                    .filter((p): p is Persona => !!p);

               responderId = await determineNextSpeaker(
                   chatConfig,
                   chatSession.messages,
                   participants
               );
            } catch (e) {
               console.warn("Moderator failed, fallback random");
            }
        }
        
        // 3. Fallback
        if (!responderId || !potentialResponders.includes(responderId)) {
             responderId = potentialResponders[Math.floor(Math.random() * potentialResponders.length)];
        }
    }

    const responder = personas.get(responderId);
    if (!responder) {
        processingRef.current = false;
        return;
    }

    // --- Execution ---
    processingRef.current = true;
    setTypingChatId(chatSession.id); // Lock visual to this chat
    setTypingPersonaId(responderId);

    const delay = (isAuto || isManualTrigger) ? 1500 + Math.random() * 1000 : 800;

    setTimeout(async () => {
        try {
            // Re-fetch fresh state
            const currentChatState = chats.find(c => c.id === targetChatId);
            if (!currentChatState) return;

            const replyText = await generatePersonaReply(
                chatConfig,
                responder,
                personas,
                currentChatState.messages
            );

            const newMsg: Message = {
                id: `msg-${Date.now()}`,
                senderId: responderId!,
                content: replyText,
                timestamp: Date.now()
            };

            updateChatMessages(targetChatId, newMsg);

        } catch (err) {
            console.error("AI Gen Error", err);
        } finally {
            processingRef.current = false;
            setTypingPersonaId(null);
            setTypingChatId(null);
        }
    }, delay);
  };

  // Polling effect for Auto-Chat
  useEffect(() => {
    const interval = setInterval(() => {
        // Find a chat that is AUTO enabled and needs processing
        const autoChat = chats.find(c => autoChatStatus[c.id] && c.messages.length > 0);
        if (autoChat) {
             // Only trigger if last message wasn't too recent (debounce) or handled by existing lock
             const lastMsg = autoChat.messages[autoChat.messages.length - 1];
             // We rely on processingRef to prevent overlap, but we also need to ensure we don't get stuck
             // if the AI just replied, we need to wait a bit? No, the logic inside triggerAIGeneration has a delay.
             triggerAIGeneration(autoChat.id);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [chats, autoChatStatus, apiKey, baseURL, modelName]);

  // Manual Trigger handler
  const handleTriggerRandomAI = () => {
      if (activeChatId) {
          triggerAIGeneration(activeChatId, true);
      }
  };


  // --- Actions ---

  const handleSendMessage = (text: string) => {
    if (!activeChatId) return;
    if (!apiKey) {
        setShowSettings(true);
        return;
    }
    const newMsg: Message = {
        id: `msg-${Date.now()}`,
        senderId: HUMAN_ID,
        content: text,
        timestamp: Date.now()
    };
    updateChatMessages(activeChatId, newMsg);
    
    // Trigger AI immediately after user message
    // We use a slight timeout to allow state update
    setTimeout(() => triggerAIGeneration(activeChatId), 100);
  };

  const handleCreateChat = (name: string, participantIds: string[]) => {
    const newChat: ChatSession = {
        id: `chat-${Date.now()}`,
        name,
        participantIds: [HUMAN_ID, ...participantIds],
        messages: [
            {
                id: `sys-${Date.now()}`,
                senderId: 'system',
                content: 'Group created',
                timestamp: Date.now(),
                isSystem: true
            }
        ],
        isGroup: true,
        lastMessageAt: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView(AppView.CHAT);
    setShowCreateModal(false);
  };

  const handleStartDirectChat = (targetPersonaId: string) => {
      const target = personas.get(targetPersonaId);
      if (!target) return;

      const existingChat = chats.find(c => 
          !c.isGroup && 
          c.participantIds.includes(targetPersonaId) && 
          c.participantIds.includes(HUMAN_ID)
      );

      if (existingChat) {
          setActiveChatId(existingChat.id);
          setView(AppView.CHAT);
      } else {
          const newChat: ChatSession = {
              id: `chat-dm-${targetPersonaId}`,
              name: target.name,
              participantIds: [HUMAN_ID, targetPersonaId],
              messages: [],
              isGroup: false,
              lastMessageAt: Date.now()
          };
          setChats(prev => [newChat, ...prev]);
          setActiveChatId(newChat.id);
          setView(AppView.CHAT);
      }
  };

  const handleSaveChatSettings = (config: AIConfig | undefined) => {
      if (!activeChatId) return;
      setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
              return { ...c, config };
          }
          return c;
      }));
  };
  
  const handleInviteToChat = (personaId: string) => {
      if (!activeChatId) return;
      const person = personas.get(personaId);
      if (!person) return;

      setChats(prev => prev.map(c => {
          if (c.id === activeChatId && !c.participantIds.includes(personaId)) {
              return {
                  ...c,
                  participantIds: [...c.participantIds, personaId],
                  messages: [
                      ...c.messages,
                      {
                          id: `sys-inv-${Date.now()}`,
                          senderId: 'system',
                          content: `Invited ${person.name} to the group`,
                          timestamp: Date.now(),
                          isSystem: true
                      }
                  ]
              };
          }
          return c;
      }));
  };

  const handleClearHistory = () => {
      if (!activeChatId) return;
      setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
              return {
                  ...c,
                  messages: []
              };
          }
          return c;
      }));
      // Also reset auto chat status just in case
      setAutoChatStatus(prev => ({ ...prev, [activeChatId]: false }));
  };

  const handleAddPersona = (p: Persona) => {
    setPersonas(prev => {
        const newMap = new Map(prev);
        newMap.set(p.id, p);
        return newMap;
    });
  };

  const handleDeletePersona = (id: string) => {
      setPersonas(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
      });
  };

  const toggleAutoChat = () => {
      if (!activeChatId) return;
      if (!apiKey) {
          setShowSettings(true);
          return;
      }
      setAutoChatStatus(prev => ({
          ...prev,
          [activeChatId]: !prev[activeChatId]
      }));
  };

  const handleResetData = () => {
      localStorage.clear();
      window.location.reload();
  };

  const handleSaveGlobalSettings = (key: string, url: string, model: string) => {
      setApiKey(key);
      setBaseURL(url);
      setModelName(model);
  };

  const toggleLanguage = () => setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const containerClass = theme === 'light' 
    ? "w-[95vw] h-[95vh] bg-white rounded-lg shadow-2xl flex overflow-hidden relative"
    : "w-[95vw] h-[95vh] bg-[#1e1e1e] rounded-lg shadow-2xl flex overflow-hidden relative border border-[#333]";

  return (
    <div className={containerClass}>
      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        user={currentUser} 
        onOpenSettings={() => setShowSettings(true)}
        language={language}
        onToggleLanguage={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {view === AppView.CHAT && (
        <>
            <ChatList 
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={setActiveChatId}
                onCreateChat={() => setShowCreateModal(true)}
                personas={personas}
                language={language}
                theme={theme}
            />
            {activeChat ? (
                <ChatWindow 
                    chat={activeChat}
                    currentUser={currentUser}
                    personas={personas}
                    onSendMessage={handleSendMessage}
                    isAutoChatActive={!!autoChatStatus[activeChat.id]}
                    onToggleAutoChat={toggleAutoChat}
                    onTriggerRandom={handleTriggerRandomAI} // New prop
                    onOpenChatSettings={() => setShowChatSettings(true)}
                    typingPersonaId={typingPersonaId}
                    typingChatId={typingChatId} // New prop
                    language={language}
                    theme={theme}
                />
            ) : (
                <div className={`flex-1 flex items-center justify-center flex-col gap-4 ${theme === 'light' ? 'bg-[#f5f5f5] text-gray-400' : 'bg-[#121212] text-gray-500'}`}>
                   <p>Select a chat to start messaging</p>
                   {!apiKey && (
                       <button onClick={() => setShowSettings(true)} className="text-[#07c160] hover:underline text-sm">
                           Configure API Settings to enable AI
                       </button>
                   )}
                </div>
            )}
        </>
      )}

      {view === AppView.CONTACTS && (
          <PersonaManager 
            personas={personas} 
            onAddPersona={handleAddPersona}
            onDeletePersona={handleDeletePersona}
            onStartDirectChat={handleStartDirectChat}
            availableModels={availableModels}
            language={language}
            theme={theme}
          />
      )}

      {showCreateModal && (
          <CreateChatModal 
            personas={personas}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateChat}
            language={language}
            theme={theme}
          />
      )}

      {showSettings && (
          <SettingsModal 
            apiKey={apiKey}
            baseURL={baseURL}
            modelName={modelName}
            availableModels={availableModels}
            onUpdateModels={setAvailableModels}
            onSave={handleSaveGlobalSettings}
            onClose={() => setShowSettings(false)}
            onResetData={handleResetData}
            language={language}
            theme={theme}
          />
      )}

      {showChatSettings && activeChat && (
          <ChatSettingsModal 
            chatName={activeChat.name}
            currentConfig={activeChat.config}
            globalConfig={{ apiKey, baseURL, model: modelName }}
            availableModels={availableModels}
            onSave={handleSaveChatSettings}
            onClose={() => setShowChatSettings(false)}
            
            // New Props
            currentMembers={activeChat.participantIds}
            allPersonas={personas}
            onInvite={handleInviteToChat}
            onClearHistory={handleClearHistory}
            messages={activeChat.messages}

            language={language}
            theme={theme}
          />
      )}
    </div>
  );
}
