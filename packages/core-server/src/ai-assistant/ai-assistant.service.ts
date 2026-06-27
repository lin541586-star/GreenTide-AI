import { Injectable, Logger } from '@nestjs/common';
import { LlmFactoryService } from '../ai-agent/llm/llm-factory.service';
import { LlmMessage, LlmToolDefinition } from '../ai-agent/llm/llm.interface';
import { PrismaService } from '../prisma.service';
import { TenantService } from '../tenant/tenant.service';

export interface AiChatInput {
  tenantId: string;
  message: string;
  /** 目前所在的工具頁面: crm | inventory | notifications | analytics | dashboard */
  context?: string;
  /** 額外上下文資料（由前端頁面提供） */
  contextData?: Record<string, any>;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AiChatOutput {
  reply: string;
  actions?: { label: string; action: string }[];
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly llmFactory: LlmFactoryService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async chat(input: AiChatInput): Promise<AiChatOutput> {
    // 從資料庫載入 AI 設定（若 DB 有設定則覆蓋 .env）
    const dbConfig = await this.tenantService.getEffectiveAiConfig(input.tenantId);
    this.llmFactory.initFromDbConfig(dbConfig);
    const provider = this.llmFactory.getProvider();
    if (!provider) {
      return { reply: '⚠️ AI 尚未設定，請前往「店家設定」→「AI 智慧設定」填入 API Key 即可啟用！' };
    }

    const systemPrompt = await this.buildSystemPrompt(input);
    const tools = this.buildTools(input.context);

    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(input.history || []).slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: input.message },
    ];

    try {
      const response = await provider.chat(messages, tools);

      // 處理 tool calls
      let reply = response.text;
      if (response.toolCalls?.length) {
        for (const tc of response.toolCalls) {
          const result = await this.executeToolCall(tc, input);
          messages.push({ role: 'assistant', content: response.text });
          messages.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: tc.id });
        }
        const finalResponse = await provider.chat(messages, tools);
        reply = finalResponse.text;
      }

      // 判斷是否需要提供建議操作
      const actions = this.detectActions(reply, input.context);

      return { reply, actions };
    } catch (err: any) {
      this.logger.error(`AI Assistant 錯誤: ${err.message}`);
      return { reply: '抱歉，AI 處理時發生錯誤，請稍後再試。' };
    }
  }

  private async buildSystemPrompt(input: AiChatInput): Promise<string> {
    const ctx = input.context || 'general';
    const tenant = await this.prisma.tenant.findUnique({ where: { id: input.tenantId } });
    const tenantName = tenant?.name || '店家';

    const contextPrompts: Record<string, string> = {
      general: `你是「${tenantName}」的 AI 智慧營運助手，協助店家老闆管理各項營運事務。
你可以回答關於客戶管理、庫存管理、通知發送、營運報表等各種問題。
回覆使用繁體中文，語氣專業且易懂，盡量提供具體建議。`,

      crm: `你正在協助管理「${tenantName}」的客戶資料庫。

你可以協助的事項：
1. **客戶分析**：根據提供的客戶資料進行分析
2. **標籤建議**：根據客戶資訊推薦標籤
3. **流失預警**：識別可能流失的客戶
4. **搜尋協助**：協助用自然語言搜尋客戶
5. **行銷建議**：針對特定客戶群提供個人化行銷建議

當前客戶總數: ${input.contextData?.totalCustomers || '未知'}
回覆使用繁體中文，語氣親切專業。`,

      inventory: `你正在協助管理「${tenantName}」的商品庫存。

你可以協助的事項：
1. **補貨建議**：根據庫存數量和低庫存警戒線提供補貨建議
2. **庫存分析**：分析各類商品的庫存狀況
3. **異常偵測**：識別庫存異常波動
4. **成本優化**：提供採購時機建議
5. **盤點協助**：協助記錄和計算盤點差異

低庫存商品數量: ${input.contextData?.lowStockCount || '未知'}
回覆使用繁體中文，語氣專業清晰。`,

      notifications: `你正在協助「${tenantName}」管理通知系統。

你可以協助的事項：
1. **文案生成**：根據需求自動生成行銷或提醒文案
2. **發送策略**：建議最佳發送時間和管道
3. **模板建議**：提供常見通知模板範本
4. **效果分析**：分析已發送通知的效果

回覆使用繁體中文，語氣專業且富有創意。`,

      analytics: `你正在協助「${tenantName}」分析營運數據。

你可以協助的事項：
1. **數據解讀**：分析圖表中的數據趨勢
2. **營運建議**：根據數據提供具體經營策略
3. **預測分析**：根據歷史數據預測未來趨勢
4. **問題診斷**：找出數據異常背後的可能原因
5. **目標設定**：協助設定合理的營運目標

回覆使用繁體中文，語氣專業且數據驅動。`,

      dashboard: `你是「${tenantName}」的 AI 營運儀表板助手。
你可以根據儀表板上的各項 KPI 數據提供經營分析與建議。
回覆使用繁體中文，語氣簡潔有洞察力。`,
    };

    return contextPrompts[ctx] || contextPrompts.general;
  }

  private buildTools(context?: string): LlmToolDefinition[] {
    const commonTools: LlmToolDefinition[] = [
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '取得當前日期與時間',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];

    const contextTools: Record<string, LlmToolDefinition[]> = {
      crm: [
        {
          type: 'function',
          function: {
            name: 'search_customers',
            description: '搜尋客戶，支援自然語言查詢',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜尋關鍵字' },
              },
              required: ['query'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'suggest_tags',
            description: '根據客戶資訊推薦標籤',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '客戶姓名' },
                notes: { type: 'string', description: '客戶備註' },
              },
              required: ['name'],
            },
          },
        },
      ],
      inventory: [
        {
          type: 'function',
          function: {
            name: 'get_low_stock_products',
            description: '查詢所有低庫存商品',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_product_details',
            description: '查詢特定商品詳細資訊',
            parameters: {
              type: 'object',
              properties: {
                productId: { type: 'string', description: '商品 ID' },
              },
              required: ['productId'],
            },
          },
        },
      ],
      analytics: [
        {
          type: 'function',
          function: {
            name: 'get_revenue_data',
            description: '查詢營收數據',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_service_ranking',
            description: '查詢服務項目排行',
            parameters: { type: 'object', properties: {} },
          },
        },
      ],
    };

    return [...commonTools, ...(contextTools[context || ''] || [])];
  }

  private async executeToolCall(tc: any, input: AiChatInput): Promise<any> {
    this.logger.log(`AI assistant 執行 tool: ${tc.name}`);

    switch (tc.name) {
      case 'get_current_time':
        return { now: new Date().toISOString() };

      case 'search_customers': {
        const { query } = tc.arguments;
        const customers = await this.prisma.customer.findMany({
          where: {
            tenantId: input.tenantId,
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
              { notes: { contains: query } },
            ],
          },
          take: 10,
        });
        return customers;
      }

      case 'suggest_tags': {
        const { name, notes } = tc.arguments;
        // 規則式預設標籤（AI 會再根據 context 給建議）
        const tags = ['一般'];
        if (notes?.length > 10) tags.push('有紀錄');
        return { suggestedTags: tags, name };
      }

      case 'get_low_stock_products': {
        const products = await this.prisma.product.findMany({
          where: { tenantId: input.tenantId, active: true },
        });
        return products.filter(p => p.quantity <= p.minStock);
      }

      case 'get_product_details': {
        const product = await this.prisma.product.findFirst({
          where: { id: tc.arguments.productId, tenantId: input.tenantId },
        });
        return product || { error: '商品不存在' };
      }

      case 'get_revenue_data': {
        const bookings = await this.prisma.booking.findMany({
          where: { tenantId: input.tenantId, status: 'completed' },
          include: { service: true },
          take: 50,
        });
        return bookings.map(b => ({
          date: b.date,
          service: b.service?.name || '未知',
          price: b.service?.price || 0,
        }));
      }

      case 'get_service_ranking': {
        const bookings = await this.prisma.booking.findMany({
          where: { tenantId: input.tenantId, serviceId: { not: null }, status: { not: 'cancelled' } },
          include: { service: true },
        });
        const ranking: Record<string, { name: string; count: number }> = {};
        for (const b of bookings) {
          if (!b.service) continue;
          if (!ranking[b.serviceId!]) ranking[b.serviceId!] = { name: b.service.name, count: 0 };
          ranking[b.serviceId!].count++;
        }
        return Object.entries(ranking)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.count - a.count);
      }

      default:
        return { error: `未知工具: ${tc.name}` };
    }
  }

  private detectActions(reply: string, context?: string): { label: string; action: string }[] | undefined {
    const lower = reply.toLowerCase();
    const actions: { label: string; action: string }[] = [];

    if (context === 'crm' && (lower.includes('標籤') || lower.includes('分類'))) {
      actions.push({ label: '開啟客戶管理', action: 'navigate:/app/crm' });
    }
    if (context === 'inventory' && (lower.includes('補貨') || lower.includes('庫存'))) {
      actions.push({ label: '開啟庫存管理', action: 'navigate:/app/inventory' });
    }
    if (context === 'analytics') {
      actions.push({ label: '查看完整報表', action: 'navigate:/app/analytics' });
    }

    return actions.length ? actions : undefined;
  }
}
