import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ILlmProvider,
  LlmMessage,
  LlmToolDefinition,
  LlmToolCall,
  LlmResponse,
} from './llm.interface';

@Injectable()
export class DeepSeekProvider implements ILlmProvider {
  private readonly logger = new Logger(DeepSeekProvider.name);
  readonly name = 'deepseek';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseURL?: string, model: string = 'deepseek-chat') {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseURL || 'https://api.deepseek.com/v1',
    });
    this.model = model;
  }

  async chat(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
  ): Promise<LlmResponse> {
    try {
      const openaiMessages = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant' | 'tool',
        content: m.content,
        tool_call_id: m.tool_call_id,
        tool_calls: m.tool_calls,
      }));

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages as any,
        tools: tools as any,
        tool_choice: 'auto' as const,
      });

      const choice = completion.choices[0];
      const text = choice?.message?.content || '';

      // 解析 tool calls — 需處理 union type
      const toolCallsData = choice?.message?.tool_calls;
      const toolCalls: LlmToolCall[] | undefined = toolCallsData?.length
        ? toolCallsData.map((tc: any) => ({
            id: tc.id,
            name: tc.function?.name || '',
            arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
          }))
        : undefined;

      return { text, toolCalls };
    } catch (err: any) {
      this.logger.error(`DeepSeek API 錯誤: ${err.message}`);
      this.logger.error(`DeepSeek API 錯誤詳情: ${JSON.stringify(err?.response?.data || err)}`);
      return { text: `抱歉，AI 處理時發生錯誤。(${err.message})` };
    }
  }

  /** 圖片分析（DeepSeek V4 Flash 支援多模態視覺） */
  async visionChat(imageBase64: string, mimeType: string, prompt: string): Promise<LlmResponse> {
    try {
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ] as any,
      });
      const text = completion.choices[0]?.message?.content || '';
      return { text };
    } catch (err: any) {
      this.logger.error(`DeepSeek Vision 錯誤: ${err.message}`);
      this.logger.error(JSON.stringify(err?.response?.data || err));
      return { text: '' };
    }
  }
}
