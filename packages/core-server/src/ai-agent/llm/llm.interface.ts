/**
 * LLM 供應商統一介面
 * 支援 Gemini / DeepSeek / OpenAI 等不同供應商
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** tool call 結果的對應 ID */
  tool_call_id?: string;
  /** assistant 回覆中的 tool calls 列表 */
  tool_calls?: Array<{
    id: string;
    type?: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LlmResponse {
  text: string;
  toolCalls?: LlmToolCall[];
}

export interface ILlmProvider {
  readonly name: string;
  chat(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
  ): Promise<LlmResponse>;
  /** 圖片分析（vision），支援 base64 圖片 */
  visionChat?(imageBase64: string, mimeType: string, prompt: string): Promise<LlmResponse>;
}

/** LLM 供應商設定 */
export interface LlmProviderConfig {
  provider: 'gemini' | 'deepseek';
  apiKey: string;
  model: string;
  /** DeepSeek/OpenAI 相容 API 需要 baseURL */
  baseURL?: string;
}
