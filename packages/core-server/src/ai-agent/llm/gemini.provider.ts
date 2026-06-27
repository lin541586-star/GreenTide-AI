import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  ILlmProvider,
  LlmMessage,
  LlmToolDefinition,
  LlmToolCall,
  LlmResponse,
} from './llm.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async chat(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
  ): Promise<LlmResponse> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemMsg?.content,
    });

    // 過濾 system message，Gemini 用 systemInstruction 處理
    const history: any[] = [];
    for (const m of messages.filter((m) => m.role !== 'system')) {
      if (m.role === 'tool') {
        // tool 回覆 → functionResponse part
        const lastFnCall = [...messages].reverse().find(
          (x) => x.role === 'assistant' && x.tool_calls?.length,
        );
        const fnName = lastFnCall?.tool_calls?.find(
          (tc) => tc.id === m.tool_call_id,
        )?.function?.name || 'unknown';
        history.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: fnName,
                response: { response: m.content },
              },
            },
          ],
        });
      } else if (m.role === 'assistant' && m.tool_calls?.length) {
        // assistant 含 function call
        history.push({
          role: 'model',
          parts: [
            ...(m.content ? [{ text: m.content }] : []),
            ...m.tool_calls.map((tc) => ({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments),
              },
            })),
          ],
        });
      } else {
        history.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        });
      }
    }

    // 轉換 tools 為 Gemini 格式
    const geminiTools = tools?.length
      ? tools.map((t) => ({
          functionDeclarations: [
            {
              name: t.function.name,
              description: t.function.description,
              parameters: this.convertToGeminiSchema(t.function.parameters),
            },
          ],
        }))
      : undefined;

    try {
      const chat = genModel.startChat({
        history: history.slice(0, -1),
        tools: geminiTools as any,
      });

      const lastMsg = history[history.length - 1];
      const result = await chat.sendMessage(lastMsg?.parts[0]?.text || '');
      const candidate = result.response.candidates?.[0];

      const text = candidate?.content?.parts
        ?.filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join('') || '';

      // 解析 function calls
      const fnCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall) || [];
      const toolCalls: LlmToolCall[] = fnCalls.map((fc: any) => ({
        id: fc.functionCall.name,
        name: fc.functionCall.name,
        arguments: fc.functionCall.args || {},
      }));

      return { text, toolCalls: toolCalls.length ? toolCalls : undefined };
    } catch (err: any) {
      this.logger.error(`Gemini API 錯誤: ${err.message}`);
      this.logger.error(`Gemini API 錯誤詳情: ${JSON.stringify(err?.message || err)}`);
      return { text: `抱歉，AI 處理時發生錯誤。(${err.message})` };
    }
  }

  private convertToGeminiSchema(params: Record<string, any>): any {
    if (!params) return {};
    const schema: any = {
      type: SchemaType.OBJECT,
      properties: {},
    };
    if (params.properties) {
      for (const [key, val] of Object.entries<any>(params.properties)) {
        schema.properties[key] = {
          type: this.mapType(val.type),
          description: val.description || '',
        };
        if (val.enum) schema.properties[key].enum = val.enum;
      }
    }
    if (params.required) schema.required = params.required;
    return schema;
  }

  private mapType(type: string): SchemaType {
    const map: Record<string, SchemaType> = {
      string: SchemaType.STRING,
      number: SchemaType.NUMBER,
      integer: SchemaType.INTEGER,
      boolean: SchemaType.BOOLEAN,
      array: SchemaType.ARRAY,
      object: SchemaType.OBJECT,
    };
    return map[type] || SchemaType.STRING;
  }

  /** 圖片分析 vision：傳入 base64 圖片 + 提示詞，回傳辨識結果 */
  async visionChat(imageBase64: string, mimeType: string, prompt: string): Promise<LlmResponse> {
    const genModel = this.client.getGenerativeModel({ model: this.model });
    try {
      const result = await genModel.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ]);
      const text = result.response.text();
      return { text };
    } catch (err: any) {
      this.logger.error(`Gemini Vision API 錯誤: ${err.message}`);
      return { text: '' };
    }
  }
}
