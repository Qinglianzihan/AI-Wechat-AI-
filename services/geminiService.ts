
import { Message, Persona, AIConfig } from "../types";

interface FetchModelsResult {
  models: string[];
  activeBaseURL: string;
}

/**
 * Helper to parse model response from various API formats
 */
const parseModelsFromJSON = (json: any): string[] => {
  // Case 1: NewAPI/OneAPI format { success: true, data: { "1": ["gpt-3"], "2": ["gpt-4"] } }
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
    const allModels = Object.values(json.data).flat() as string[];
    return Array.from(new Set(allModels)).sort();
  }
  
  // Case 2: Standard OpenAI format { data: [{ id: "gpt-3" }, ...] }
  if (Array.isArray(json.data)) {
    return json.data.map((m: any) => m.id).sort();
  }

  // Case 3: Direct array { models: [...] } or just [...]
  if (Array.isArray(json)) {
    return json.map((m: any) => (typeof m === 'string' ? m : m.id)).filter(Boolean).sort();
  }

  return [];
};

/**
 * Fetches the list of available models.
 */
export const fetchAvailableModels = async (inputURL: string, apiKey: string): Promise<FetchModelsResult> => {
  let urlObj: URL;
  try {
    urlObj = new URL(inputURL);
  } catch (e) {
    throw new Error("Invalid Base URL format");
  }

  const cleanInput = inputURL.replace(/\/+$/, "");
  const origin = urlObj.origin;

  const candidates = [
    { url: `${cleanInput}/models`, derivedBaseURL: cleanInput },
    { url: `${cleanInput}/v1/models`, derivedBaseURL: `${cleanInput}/v1` },
    { url: `${origin}/api/models`, derivedBaseURL: `${origin}/v1` },
    { url: `${origin}/v1/models`, derivedBaseURL: `${origin}/v1` }
  ];

  const uniqueCandidates = candidates.filter((c, index, self) => 
    index === self.findIndex((t) => t.url === c.url)
  );

  let lastError: Error | null = null;

  for (const candidate of uniqueCandidates) {
    try {
      // console.log(`Trying to fetch models from: ${candidate.url}`);
      const response = await fetch(candidate.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const json = await response.json();
        const models = parseModelsFromJSON(json);
        
        if (models.length > 0) {
          // console.log(`Success! Found ${models.length} models at ${candidate.url}`);
          return { models, activeBaseURL: candidate.derivedBaseURL };
        }
      } else {
        if (response.status === 401) {
            throw new Error("401 Unauthorized: Check your API Key");
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Unknown error");
    }
  }

  throw lastError || new Error("Failed to connect to any model endpoint. Check URL and CORS settings.");
};

/**
 * The Moderator: Determines who should speak next based on context.
 */
export const determineNextSpeaker = async (
  config: AIConfig,
  chatHistory: Message[],
  participants: Persona[]
): Promise<string | null> => {
  const { apiKey, baseURL, model } = config;
  if (!apiKey) return null;
  
  const finalBaseURL = baseURL.replace(/\/+$/, "");
  const endpoint = `${finalBaseURL}/chat/completions`;

  const candidates = participants.filter(p => !p.isUser);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  // Summarize recent context (last 3 is enough for decision)
  const recentMsgs = chatHistory.slice(-3);
  const contextText = recentMsgs.map(m => {
      const sender = participants.find(p => p.id === m.senderId)?.name || "User";
      return `${sender}: ${m.content}`;
  }).join("\n");

  const candidateListText = candidates.map(p => `- ID: "${p.id}", Name: "${p.name}", Role: "${p.description}"`).join("\n");

  // Simplified prompt for faster inference with smaller models (e.g. Qwen-8b)
  const prompt = `
Task: Decide who speaks next in this group chat.
Context:
${contextText}

Candidates:
${candidateListText}

Rules:
1. If someone was asked a question, pick them.
2. Otherwise, pick the most relevant character to the topic.
3. Output JSON ONLY: { "nextSpeakerId": "ID" }
`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 100 // Increased slightly to accommodate verbose models
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) return null;

    // 1. Clean wrapping markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        // 2. Try pure JSON parsing
        const result = JSON.parse(cleanedText);
        return result.nextSpeakerId || null;
    } catch {
        // 3. Robust Regex Fallback (handles "nextSpeakerId": 'id', unquoted keys, etc.)
        // Look for "nextSpeakerId" followed by colon, optional whitespace, optional quote, the ID, optional quote
        const match = cleanedText.match(/["']?nextSpeakerId["']?\s*[:=]\s*["']?([^"'\s,}]+)["']?/i);
        if (match && match[1]) {
            // Validate that the regex result is actually one of the candidate IDs
            const validID = candidates.find(c => c.id === match[1]);
            return validID ? validID.id : null;
        }
        return null;
    }

  } catch (e) {
    console.error("Moderator Error:", e);
    return null; 
  }
};

/**
 * Generates a reply using a generic OpenAI-compatible API endpoint.
 */
export const generatePersonaReply = async (
  config: AIConfig,
  targetPersona: Persona,
  allPersonas: Map<string, Persona>,
  chatHistory: Message[]
): Promise<string> => {
  const { apiKey, baseURL, model: globalModel } = config;

  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Clean base URL
  const finalBaseURL = baseURL.replace(/\/+$/, ""); 
  const endpoint = `${finalBaseURL}/chat/completions`;

  // 1. Build System Instruction
  const participantNames = Array.from(allPersonas.values())
    .filter(p => !p.isUser)
    .map(p => p.name)
    .join(", ");

  const systemPrompt = `
You are ${targetPersona.name}.
Description: ${targetPersona.systemInstruction}

CONTEXT:
- You are chatting in a WeChat group (微信群聊).
- Participants: ${participantNames}
- Current User: "Me"

INSTRUCTIONS:
- Speak strictly as ${targetPersona.name}.
- Keep messages SHORT, casual, and colloquial (WeChat style).
- Do NOT use formal letter formats.
- NEVER start the message with your name (e.g. "${targetPersona.name}: ...").
- NEVER output "Me:" or "System:".
- Reply directly to the context.
`;

  // 2. Format Messages for OpenAI format
  const messagesPayload = [
    { role: "system", content: systemPrompt }
  ];

  // Take recent history
  const recentMessages = chatHistory.slice(-20);

  recentMessages.forEach(msg => {
    if (msg.isSystem) return;

    const sender = allPersonas.get(msg.senderId);
    const prefix = sender ? `${sender.name}: ` : "Unknown: ";
    
    if (msg.senderId === targetPersona.id) {
      messagesPayload.push({
        role: "assistant",
        content: msg.content
      });
    } else {
      messagesPayload.push({
        role: "user",
        content: `${prefix}${msg.content}`
      });
    }
  });

  const effectiveModel = targetPersona.model || globalModel || "gpt-3.5-turbo";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: messagesPayload,
        temperature: 0.9,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Details:", errorData);
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "";
    
    if (!reply) {
      throw new Error("Invalid response format from API");
    }

    // --- Post Processing: Clean Output ---

    // 1. Remove DeepSeek/Reasoning model <think> tags
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. Remove prefixes (Name:, Me:, etc.)
    const prefixesToRemove = [
        targetPersona.name,
        "Me", "I", "我", "System", "Role", "Assistant"
    ];
    
    // Regex matches start of string, optional whitespace, Name, optional colon/Chinese colon, optional whitespace
    const pattern = new RegExp(`^(${prefixesToRemove.join('|')})[:：]?\\s*`, 'i');
    reply = reply.replace(pattern, '');
    
    // 3. Clean wrapping quotes
    reply = reply.replace(/^["']|["']$/g, '').trim();

    if (!reply) return "...";

    return reply;

  } catch (error) {
    console.error("AI Service Error:", error);
    return `(System: Error connecting to AI provider. ${error instanceof Error ? error.message : 'Unknown'})`;
  }
};
