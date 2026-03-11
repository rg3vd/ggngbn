import { OPENROUTER_SYSTEM_PROMPT_UA } from './openrouterPrompt';

export type OpenRouterRole = 'system' | 'user' | 'assistant';

export interface OpenRouterMessage {
  role: OpenRouterRole;
  content: string;
}

interface OpenRouterChatParams {
  apiKey: string;
  model: string;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
}

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export const buildSystemPrompt = (): string => OPENROUTER_SYSTEM_PROMPT_UA;

export const applyBlackoutMask = (text: string): string => {
  // Minimal BLACKOUT: mask digits. (We can expand to currencies later.)
  return text.replace(/[0-9]/g, '█');
};

export const openRouterChat = async (params: OpenRouterChatParams): Promise<string> => {
  const body = {
    model: params.model,
    messages: params.messages,
    max_tokens: params.maxTokens ?? 260,
    temperature: params.temperature ?? 0.6,
  };

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      // Optional but recommended by OpenRouter for attribution.
      'X-Title': 'Skarbnychka Mrii',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`openrouter_http_${response.status}${text ? `: ${text}` : ''}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('openrouter_empty_response');
  }

  return content.trim();
};
