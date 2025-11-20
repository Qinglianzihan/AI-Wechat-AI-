
export interface Persona {
  id: string;
  name: string;
  avatar: string; // URL or placeholder
  description: string; // For UI display
  systemInstruction: string; // The prompt for Gemini
  isUser: boolean; // True if it represents the human user
  model?: string; // Optional specific model for this persona
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isSystem?: boolean; // For "X added Y to the chat" messages
}

export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface ChatSession {
  id: string;
  name: string;
  participantIds: string[]; // IDs of Personas in this chat
  messages: Message[];
  isGroup: boolean;
  lastMessageAt: number;
  config?: AIConfig; // Optional override for this specific chat
}

export enum AppView {
  CHAT = 'CHAT',
  CONTACTS = 'CONTACTS',
}

export type Language = 'zh' | 'en';

export type Theme = 'light' | 'dark';
