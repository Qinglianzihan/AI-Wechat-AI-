
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Message, Persona, Language, Theme } from '../types';
import { MoreHorizontal, Smile, Paperclip, Play, Pause, Dices } from 'lucide-react';
import { translations } from '../translations';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  chat: ChatSession;
  currentUser: Persona;
  personas: Map<string, Persona>;
  onSendMessage: (text: string) => void;
  isAutoChatActive: boolean;
  onToggleAutoChat: () => void;
  onTriggerRandom: () => void; // New Prop
  onOpenChatSettings: () => void;
  typingPersonaId: string | null;
  typingChatId: string | null; // New Prop
  language: Language;
  theme: Theme;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  currentUser, 
  personas, 
  onSendMessage,
  isAutoChatActive,
  onToggleAutoChat,
  onTriggerRandom,
  onOpenChatSettings,
  typingPersonaId,
  typingChatId,
  language,
  theme
}) => {
  const t = translations[language];
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, typingPersonaId]);

  // Reset input when switching chats to prevent "ghost" text
  useEffect(() => {
      setInputValue('');
  }, [chat.id]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSendMessage(inputValue);
        setInputValue('');
      }
    }
  };

  const getSender = (msg: Message) => personas.get(msg.senderId);
  
  // CRITICAL FIX: Only show typing indicator if the typing event belongs to THIS chat
  const typingUser = (typingPersonaId && typingChatId === chat.id) ? personas.get(typingPersonaId) : null;

  // Theme Styles
  const bgClass = theme === 'light' ? 'bg-[#f5f5f5]' : 'bg-[#121212]';
  const borderClass = theme === 'light' ? 'border-[#d6d6d6]' : 'border-[#333]';
  const headerText = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const iconColor = theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white';
  
  const autoChatBtnClass = isAutoChatActive
    ? (theme === 'light' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-green-900/30 border-green-800 text-green-400')
    : (theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-[#222] border-[#444] text-gray-400');

  const diceBtnClass = theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200' : 'bg-[#222] border-[#444] text-gray-400 hover:bg-[#333]';

  // Message Bubbles
  const bubbleMe = theme === 'light' ? 'bg-[#95ec69]' : 'bg-[#07c160]';
  const bubbleMeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const arrowMe = theme === 'light' ? 'bg-[#95ec69]' : 'bg-[#07c160]';
  
  const bubbleOther = theme === 'light' ? 'bg-white border border-gray-100' : 'bg-[#2b2b2b] border border-[#333]';
  const bubbleOtherText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const arrowOther = theme === 'light' ? 'bg-white' : 'bg-[#2b2b2b]';

  // Input Area
  const inputAreaBg = theme === 'light' ? 'bg-[#f5f5f5]' : 'bg-[#1e1e1e]';
  const inputText = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const sendBtnActive = theme === 'light' ? 'bg-[#07c160] text-white hover:bg-[#06ad56]' : 'bg-[#07c160] text-white hover:bg-[#06ad56]';
  const sendBtnDisabled = theme === 'light' ? 'bg-[#e2e2e2] text-[#b2b2b2]' : 'bg-[#333] text-[#555]';

  return (
    <div className={`flex-1 flex flex-col ${bgClass} min-w-0 h-full transition-colors`}>
      {/* Header */}
      <div className={`h-[50px] border-b ${borderClass} flex items-center justify-between px-4 flex-shrink-0 ${bgClass} relative`}>
        <div className={`font-medium text-base truncate max-w-[50%] ${headerText}`}>
          {chat.name} 
          {chat.isGroup && <span className="text-gray-500 ml-1 text-sm">({chat.participantIds.length} {t.members})</span>}
        </div>
        <div className="flex items-center gap-2">
            {/* AI Controls */}
            {chat.isGroup && (
                <>
                    <button
                        onClick={onTriggerRandom}
                        className={`flex items-center justify-center w-8 h-8 rounded border transition-colors ${diceBtnClass}`}
                        title={t.random_speak}
                    >
                        <Dices size={16} />
                    </button>
                    <button 
                        onClick={onToggleAutoChat}
                        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition-colors ${autoChatBtnClass}`}
                        title="Allow AIs to chat freely"
                    >
                        {isAutoChatActive ? <Pause size={12} /> : <Play size={12} />}
                        <span className="font-semibold">{t.ai_debate}</span>
                    </button>
                </>
            )}
            
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>

            <div ref={menuRef} className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className={iconColor}>
                    <MoreHorizontal size={20} />
                </button>
                {showMenu && (
                    <div className={`absolute right-0 top-8 w-36 rounded shadow-xl py-1 z-20 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#2b2b2b] border border-[#444]'}`}>
                        <button 
                            onClick={() => {
                                setShowMenu(false);
                                onOpenChatSettings();
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] ${headerText}`}
                        >
                            {t.chat_settings}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chat.messages.map((msg, idx) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-[#dadada] text-white text-xs py-0.5 px-2 rounded opacity-70">{msg.content}</span>
              </div>
            );
          }

          const isMe = msg.senderId === currentUser.id;
          const sender = getSender(msg);
          const showName = chat.isGroup && !isMe;

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <img 
                src={sender?.avatar || "https://picsum.photos/200"} 
                alt={sender?.name} 
                className="w-9 h-9 rounded-[4px] object-cover flex-shrink-0 cursor-pointer"
                title={sender?.name}
              />

              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <span className="text-xs text-gray-500 mb-0.5 ml-1">{sender?.name}</span>
                )}
                <div className={`
                  relative px-3 py-2 text-sm rounded-[4px] shadow-sm markdown-body
                  ${isMe ? `${bubbleMe} ${bubbleMeText}` : `${bubbleOther} ${bubbleOtherText}`}
                `}>
                  {/* Triangle for bubble arrow */}
                  <div className={`absolute top-3 w-2 h-2 rotate-45 ${isMe ? `-right-1 ${arrowMe}` : `-left-1 ${arrowOther}`} `} />
                  <div className="relative z-10">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {typingUser && (
           <div className="flex gap-3 flex-row">
             <img 
                src={typingUser.avatar} 
                className="w-9 h-9 rounded-[4px] object-cover flex-shrink-0 opacity-50"
              />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 mb-0.5 ml-1">{typingUser.name}</span>
                <div className={`${theme === 'light' ? 'bg-white border-gray-100' : 'bg-[#2b2b2b] border-[#333]'} border px-3 py-2 rounded-[4px] shadow-sm`}>
                  <div className="flex gap-1 h-4 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`h-[140px] border-t ${borderClass} flex flex-col ${inputAreaBg}`}>
        {/* Toolbar */}
        <div className={`flex gap-4 px-4 py-2 ${iconColor}`}>
          <Smile size={20} className="cursor-pointer" />
          <Paperclip size={20} className="cursor-pointer" />
        </div>
        
        {/* Textarea */}
        <textarea
          className={`flex-1 ${inputAreaBg} ${inputText} px-4 resize-none focus:outline-none text-sm custom-scrollbar`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAutoChatActive ? t.interrupt : t.type_message}
        />
        
        {/* Footer/Send Button */}
        <div className="px-4 py-2 flex justify-end">
          <div className="text-xs text-gray-400 mr-4 pt-2">{t.press_enter}</div>
          <button 
            className={`px-6 py-1.5 text-sm rounded-[4px] transition-colors ${inputValue.trim() ? sendBtnActive : `${sendBtnDisabled} cursor-default`}`}
            onClick={() => {
                if(inputValue.trim()) {
                    onSendMessage(inputValue);
                    setInputValue('');
                }
            }}
            disabled={!inputValue.trim()}
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
};
