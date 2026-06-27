import { Injectable, Logger } from '@nestjs/common';
import { LlmFactoryService } from './llm/llm-factory.service';
import { LlmMessage, LlmToolDefinition, LlmToolCall } from './llm/llm.interface';
import { PrismaService } from '../prisma.service';
import { BookingService } from '../booking/booking.service';
import { TenantService } from '../tenant/tenant.service';

export interface ProcessMessageInput {
  tenantId: string;
  message: string;
  userId: string;
  channel: string;
}

export interface ProcessMessageOutput {
  reply: string;
  quickReply?: { label: string; text: string }[];
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly llmFactory: LlmFactoryService,
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
    private readonly tenantService: TenantService,
  ) {}

  /** 處理使用者訊息，回傳回覆內容 */
  async processMessage(input: ProcessMessageInput): Promise<ProcessMessageOutput> {
    const { tenantId, message, userId, channel } = input;

    // 讀取店家資訊 + 服務人員 + 服務項目 + 營業時間 + 自訂規則
    const [tenant, staffList, services, businessHours, activeRules] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.staff.findMany({ where: { tenantId, active: true } }),
      this.prisma.service.findMany({ where: { tenantId, active: true } }),
      this.prisma.businessHour.findMany({ where: { tenantId } }),
      this.prisma.aiRule.findMany({ where: { tenantId, enabled: true }, orderBy: { sortOrder: 'asc' } }),
    ]);

    if (!tenant) {
      return { reply: '找不到店家資訊，請確認連結是否正確。' };
    }

    // 從資料庫載入 AI 設定
    const dbConfig = await this.tenantService.getEffectiveAiConfig(tenantId);
    this.llmFactory.initFromDbConfig(dbConfig);
    const provider = this.llmFactory.getProvider();

    // 沒有 LLM 時使用規則回退
    if (!provider) {
      return this.fallbackReply(message, staffList, services);
    }

    // 建構 system prompt（含規則 + 語氣 + emoji 設定）
    const systemPrompt = this.buildSystemPrompt(tenant, staffList, services, businessHours, activeRules, dbConfig);

    // 建構工具定義
    const tools = this.buildTools();

    // 取得或建立對話記錄
    const conversation = await this.getOrCreateConversation(tenantId, channel, userId);
    const history: LlmMessage[] = this.parseHistory(conversation.messages);

    // 第一輪：使用者訊息 → LLM
    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20), // 最近 20 筆
      { role: 'user', content: message },
    ];

    let response = await provider.chat(messages, tools);

    // 處理 tool calls（最多 5 輪以避免無限循環）
    let rounds = 0;
    while (response.toolCalls?.length && rounds < 5) {
      // 加入 assistant 的回應（含 tool_calls 資訊）
      const assistantMsg: LlmMessage = {
        role: 'assistant',
        content: response.text,
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      };
      messages.push(assistantMsg);

      // 執行每個 tool call，並加入結果
      for (const tc of response.toolCalls) {
        const result = await this.executeToolCall(tc, tenantId);
        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: tc.id,
        });
      }

      // 把结果送回 LLM 生成最終回覆
      response = await provider.chat(messages, tools);
      rounds++;
    }

    // 儲存對話記錄
    await this.saveConversation(conversation.id, [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: response.text },
    ]);

    // 判斷是否需要快速回覆選項
    const quickReply = this.detectQuickReplies(response.text, staffList, services);

    return { reply: response.text, quickReply };
  }

  /** 建構 System Prompt */
  private buildSystemPrompt(tenant: any, staff: any[], services: any[], businessHours: any[], activeRules?: any[], aiConfig?: any): string {
    const staffDesc = staff
      .map((s) => `- ${s.name}${s.title ? `（${s.title}）` : ''}`)
      .join('\n');
    const serviceDesc = services
      .map((s) => `- ${s.name}：${s.duration} 分鐘${s.price ? `，NT${s.price}` : ''}`)
      .join('\n');

    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const hoursDesc = businessHours
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((h) => {
        const day = dayNames[h.dayOfWeek] || `週${h.dayOfWeek}`;
        if (!h.isOpen) return `- ${day}：公休`;
        return `- ${day}：${h.openTime} ~ ${h.closeTime}`;
      })
      .join('\n');

    const today = new Date();

    // 使用者自訂規則 — 使用已優化的 refinedRule（若不消耗 token），無優化則用原始規則
    let customRulesSection = '';
    if (activeRules?.length) {
      const ruleLines = activeRules.map((r, i) => `  ${i + 1}. ${r.refinedRule || r.rule}`);
      customRulesSection = `\n🔥 重要 — 以下為店家設定的強制應答規則，這些規則優先於所有預設行為，你必須嚴格遵守：\n${ruleLines.join('\n')}\n\n`;
      this.logger.log(`[systemPrompt] 載入 ${activeRules.length} 條規則: ${activeRules.map(r => (r.refinedRule || r.rule).substring(0, 40)).join(' | ')}`);
    } else {
      this.logger.log('[systemPrompt] 無自訂規則，使用預設行為');
    }

    return `${customRulesSection}你是「${tenant.name}」的 AI 預約助手。你正在透過即時通訊軟體協助顧客完成預約。

📌 基本資訊
- 店家名稱：${tenant.name}
- 行業類別：${tenant.industry}
- 今天的日期：${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日

🕐 營業時間：
${hoursDesc || '（尚無設定營業時間）'}

👤 服務人員：
${staffDesc || '（尚無服務人員資料）'}

📋 服務項目：
${serviceDesc || '（尚無服務項目資料）'}

🎯 你的任務：
1. 協助顧客查詢可用時段、完成預約
2. 回答關於服務和價格的問題
3. 如果顧客要預約，引導他提供：日期、時間、服務項目
4. 如果顧客不確定要選什麼，根據店家的服務項目推薦

💡 注意事項：
- 使用「查詢可用時段」工具來確認空檔
- 不要憑空假設時段可用，一定要查詢
- 預約成功後，清楚告知顧客預約詳情
- 如果顧客的問題超出預約範圍，友善引導回預約主題
- 如果顧客的行為或需求與店家設定的強制應答規則衝突，以強制應答規則為準

🎭 回覆風格設定（嚴格遵守）：
${this.getToneInstruction(aiConfig)}
${aiConfig?.allowEmoji ? '- ✅ 可以使用表情符號讓回覆更生動，例如 😊 👍 🎉 ✨' : '- ❌ 不可以添加任何表情符號或 emoji，保持純文字回覆'}
回覆語言：繁體中文`;
  }

  /** 根據 tone 設定回傳語氣指示 */
  private getToneInstruction(aiConfig?: any): string {
    switch (aiConfig?.tone) {
      case 'friendly':
        return '- 語氣親切友善，像朋友聊天一樣自然，使用「唷」、「喔」、「吧」等口語助詞';
      case 'professional':
        return '- 語氣專業正式，用詞精準，給人信賴感，類似銀行或醫療客服';
      case 'casual':
        return '- 語氣輕鬆隨性，簡短明快，用詞年輕化，類似社群小編';
      case 'luxury':
        return '- 語氣高貴優雅，用詞精緻，速度從容，營造高級服務體驗，使用「您」敬稱';
      default:
        return '- 語氣親切專業，平衡友善與專業感';
    }
  }

  /** 建構工具定義 */
  private buildTools(): LlmToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_available_slots',
          description: '查詢特定日期某位人員的可用時段',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: '日期，格式 YYYY-MM-DD' },
              staffId: { type: 'string', description: '服務人員 ID（選填，不填則查全部人員）' },
              serviceId: { type: 'string', description: '服務項目 ID（選填，用來計算所需時長）' },
            },
            required: ['date'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_staff_list',
          description: '查詢所有服務人員',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_service_list',
          description: '查詢所有服務項目、價格與階梯價格',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_booking',
          description: '建立新的預約',
          parameters: {
            type: 'object',
            properties: {
              staffId: { type: 'string', description: '服務人員 ID' },
              date: { type: 'string', description: '日期，格式 YYYY-MM-DD' },
              startTime: { type: 'string', description: '開始時間，格式 HH:mm' },
              endTime: { type: 'string', description: '結束時間，格式 HH:mm' },
              customerName: { type: 'string', description: '顧客姓名' },
              customerContact: { type: 'string', description: '顧客聯絡方式（電話或 LINE）' },
              serviceId: { type: 'string', description: '服務項目 ID（選填）' },
            },
            required: ['staffId', 'date', 'startTime', 'endTime', 'customerName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_bookings',
          description: '查詢某日期的預約記錄',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: '日期，格式 YYYY-MM-DD' },
              staffId: { type: 'string', description: '服務人員 ID（選填）' },
            },
            required: ['date'],
          },
        },
      },
    ];
  }

  /** 執行工具呼叫 */
  private async executeToolCall(tc: LlmToolCall, tenantId: string): Promise<any> {
    this.logger.log(`執行 tool: ${tc.name}(${JSON.stringify(tc.arguments)})`);

    try {
      switch (tc.name) {
        case 'get_staff_list': {
          const staff = await this.prisma.staff.findMany({
            where: { tenantId, active: true },
          });
          return staff.map((s) => ({ id: s.id, name: s.name, title: s.title }));
        }

        case 'get_service_list': {
          const svc = await this.prisma.service.findMany({
            where: { tenantId, active: true },
          });
          return svc.map((s) => ({
            id: s.id,
            name: s.name,
            duration: s.duration,
            price: s.price,
          }));
        }

        case 'get_available_slots': {
          const { date, staffId, serviceId } = tc.arguments as any;
          let staffIds: string[];

          if (staffId) {
            staffIds = [staffId];
          } else {
            const allStaff = await this.prisma.staff.findMany({
              where: { tenantId, active: true },
              select: { id: true },
            });
            staffIds = allStaff.map((s) => s.id);
          }

          // 取得服務時長（預設 60 分鐘）
          let duration = 60;
          if (serviceId) {
            const svc = await this.prisma.service.findUnique({
              where: { id: serviceId },
            });
            if (svc) duration = svc.duration;
          }

          // 取得所有預約
          const bookings = await this.prisma.booking.findMany({
            where: {
              tenantId,
              date,
              status: { notIn: ['cancelled'] },
            },
          });

          // 基本時段 08:00 ~ 20:00
          const allSlots: string[] = [];
          for (let h = 8; h <= 20; h++) {
            allSlots.push(
              `${String(h).padStart(2, '0')}:00`,
              `${String(h).padStart(2, '0')}:30`,
            );
          }

          const result: any[] = [];
          for (const sid of staffIds) {
            const staffInfo = await this.prisma.staff.findUnique({
              where: { id: sid },
            });
            const staffBookings = bookings.filter((b) => b.staffId === sid);

            const available: string[] = [];
            for (const slot of allSlots) {
              const [h, m] = slot.split(':').map(Number);
              const totalMin = h * 60 + m;
              const endMin = totalMin + duration;
              const endH = Math.floor(endMin / 60);
              const endM = endMin % 60;
              if (endH > 20) continue; // 超過營業時間

              const endSlot = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

              // 檢查是否有衝突
              const conflict = staffBookings.some((b) => {
                const bs = this.timeToMin(b.startTime);
                const be = this.timeToMin(b.endTime);
                return totalMin < be && endMin > bs;
              });

              if (!conflict) available.push(`${slot}~${endSlot}`);
            }

            if (staffInfo) {
              result.push({
                staffId: sid,
                staffName: staffInfo.name,
                available,
              });
            }
          }

          return result;
        }

        case 'get_bookings': {
          const { date, staffId } = tc.arguments as any;
          const bookings = await this.bookingService.findByDate(tenantId, date);
          let filtered = bookings;
          if (staffId) filtered = filtered.filter((b) => b.staffId === staffId);
          return filtered.map((b) => ({
            id: b.id,
            staffName: (b.staff as any)?.name,
            serviceName: (b.service as any)?.name,
            customerName: b.customerName,
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
          }));
        }

        case 'create_booking': {
          const args = tc.arguments as any;
          const booking = await this.bookingService.create({
            tenantId,
            staffId: args.staffId,
            serviceId: args.serviceId,
            customerName: args.customerName,
            customerContact: args.customerContact,
            source: 'line',
            date: args.date,
            startTime: args.startTime,
            endTime: args.endTime,
          });
          return {
            success: true,
            booking: {
              id: booking.id,
              staffName: (booking.staff as any)?.name,
              serviceName: (booking.service as any)?.name,
              customerName: booking.customerName,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
            },
          };
        }

        default:
          return { error: `未知的工具: ${tc.name}` };
      }
    } catch (err: any) {
      this.logger.error(`Tool ${tc.name} 執行失敗: ${err.message}`);
      return { error: err.message };
    }
  }

  /** 取得或建立對話記錄 */
  private async getOrCreateConversation(
    tenantId: string,
    channel: string,
    customerId: string,
  ) {
    const sessionId = `${channel}:${customerId}`;
    let conv = await this.prisma.conversation.findFirst({
      where: { tenantId, sessionId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          tenantId,
          source: channel,
          customerId,
          sessionId,
          messages: '[]',
        },
      });
    }

    return conv;
  }

  /** 解析對話記錄 */
  private parseHistory(messagesStr: string): LlmMessage[] {
    try {
      return JSON.parse(messagesStr);
    } catch {
      return [];
    }
  }

  /** 儲存對話記錄 */
  private async saveConversation(
    id: string,
    messages: LlmMessage[],
  ) {
    await this.prisma.conversation.update({
      where: { id },
      data: { messages: JSON.stringify(messages) },
    });
  }

  /** 時間字串轉分鐘 */
  private timeToMin(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /** AI 優化應答規則文案 */
  async refineRule(tenantId: string, rule: string): Promise<{ original: string; refined: string }> {
    const dbConfig = await this.tenantService.getEffectiveAiConfig(tenantId);
    this.llmFactory.initFromDbConfig(dbConfig);
    const provider = this.llmFactory.getProvider();
    if (!provider) throw new Error('AI 尚未設定');

    const prompt = `你是一個 AI 預約助手行為規則的撰寫專家。請將使用者輸入的「規則」改寫成 AI 最容易理解、最嚴格遵守的格式。

## 輸出格式要求
請嚴格遵守以下格式輸出，**只輸出規則本身，不加任何說明、前言、標題**：

【條件】當[具體情境]時
【動作】你必須[具體行為]

## 改寫原則
1. **條件句優先**：每條規則都要以「當...時」開頭，明確什麼情況觸發
2. **第二人稱**：直接對 AI 下指令，用「你必須」、「你不可以」、「你一定要」
3. **具體可執行**：避免抽象形容詞，寫出 AI 能執行的具體動作
4. **一條規則只做一件事**

## 範例

使用者寫：客人第一次來要介紹服務
輸出：當顧客表示是第一次來店時，你必須主動介紹店內的招牌服務項目，並詢問顧客的偏好再做推薦。

使用者寫：不要一直推銷
輸出：當顧客已明確表示不需要某項服務時，你不可以繼續推銷該服務，應立即轉換話題。

使用者寫：晚上不要打擾客人
輸出：當時間為晚上 9 點後，你不可以主動發送行銷訊息給顧客。

原始規則：${rule}

請直接回覆改寫後的規則內容：`;

    try {
      const res = await provider.chat([{ role: 'user' as const, content: prompt }]);
      const refined = res.text.trim();
      return { original: rule, refined };
    } catch (err: any) {
      this.logger.error(`refineRule 錯誤: ${err.message}`);
      return { original: rule, refined: rule };
    }
  }

  /** 與 AI 討論應答規則 */
  async chatRule(
    tenantId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ reply: string }> {
    const dbConfig = await this.tenantService.getEffectiveAiConfig(tenantId);
    this.llmFactory.initFromDbConfig(dbConfig);
    const provider = this.llmFactory.getProvider();
    if (!provider) return { reply: '⚠️ AI 尚未設定，請先前往店家設定填入 API Key。' };

    const system = `你是一個 AI 規則設計顧問。使用者在設計他們的 AI 預約助手的「應答規則」。

你的任務是幫助使用者寫出 AI 最容易理解、最嚴格遵守的規則。

## 規則格式（嚴格遵守）
每條規則必須採用以下結構，一條只做一件事：

【條件】當[具體情境]時
【動作】你必須[具體行為]

## 規則撰寫原則
1. **條件句優先**：每條規則都要以「當...時」開頭
2. **第二人稱指令**：用「你必須」、「你不可以」、「你一定要」直接對 AI 下指令
3. **具體可執行**：寫出具體動作，避免模糊形容詞
4. **正面 + 負面**：明確寫出「要做什麼」和「不可以做什麼」

## 範例規則

好的規則：
- 當顧客表示是第一次來店時，你必須先主動介紹店內最受歡迎的服務項目，再詢問顧客的需求。
- 當顧客詢問價格後表示太貴時，你不可以強迫推銷，應說明服務的價值並提供其他方案。
- 當顧客已預約成功後，你必須在回覆結尾清楚告知預約日期、時間、服務項目和價格。

不好的規則（太模糊）：
- 對客人好一點 ✗
- 介紹服務 ✗
- 不要惹客人生氣 ✗

## 你的任務
1. 如果使用者問「這條規則夠清楚嗎？」—— 分析規則是否符合上述格式，並給出具體改寫建議
2. 如果使用者想調整規則 —— 嚴格按照上述格式幫他改寫
3. 如果使用者提出新的規則想法 —— 按照上述格式幫他寫成完整規則
4. 回答關於規則撰寫的各種問題

回覆使用繁體中文，語氣專業友善。當你給出規則範例時，一定是完整的【條件】+【動作】格式。`;

    try {
      const llmMessages: LlmMessage[] = [
        { role: 'system', content: system },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];
      const res = await provider.chat(llmMessages);
      return { reply: res.text };
    } catch (err: any) {
      this.logger.error(`chatRule 錯誤: ${err.message}`);
      return { reply: '抱歉，AI 處理時發生錯誤，請稍後再試。' };
    }
  }

  private fallbackReply(
    message: string,
    staffList: any[],
    services: any[],
  ): ProcessMessageOutput {
    const msg = message.toLowerCase();

    if (msg.includes('服務') || msg.includes('項目') || msg.includes('價格')) {
      const list = services
        .map((s) => `• ${s.name}：${s.duration} 分鐘${s.price ? `，NT$${s.price}` : ''}`)
        .join('\n');
      return {
        reply: `我們提供的服務項目：\n${list}\n\n想預約哪一項呢？`,
      };
    }

    if (msg.includes('人員') || msg.includes('設計師') || msg.includes('師傅')) {
      const list = staffList
        .map((s) => `• ${s.name}${s.title ? `（${s.title}）` : ''}`)
        .join('\n');
      return {
        reply: `我們的服務人員：\n${list}\n\n有想找哪位嗎？`,
      };
    }

    if (msg.includes('今天') || msg.includes('現在') || msg.includes('時間')) {
      const now = new Date();
      return {
        reply: `現在時間是 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}。\n營業時間為 08:00 ~ 20:00。\n\n想預約今天的時段嗎？`,
      };
    }

    if (msg.includes('預約') || msg.includes('預訂') || msg.includes('訂位') || msg.includes('想')) {
      const serviceHints = services.length
        ? `\n\n我們有：${services.map((s) => s.name).join('、')}`
        : '';
      return {
        reply: `好的！我來幫您完成預約 😊\n請告訴我：\n1️⃣ 您想預約哪一天？\n2️⃣ 大約什麼時間？\n3️⃣ 想要什麼服務？${serviceHints}`,
      };
    }

    return {
      reply: `您好！我是 ${staffList[0]?.name || '店家'} 的 AI 預約助手 🤖\n\n我可以幫您：\n• 查詢服務項目與價格\n• 查看可預約時段\n• 完成預約\n\n請問有什麼可以協助您的嗎？`,
      quickReply: [
        { label: '查看服務', text: '有什麼服務？' },
        { label: '我要預約', text: '我要預約' },
      ],
    };
  }

  /** 偵測是否需要提供快速回覆選項 */
  private detectQuickReplies(
    reply: string,
    staffList: any[],
    services: any[],
  ): { label: string; text: string }[] | undefined {
    const lower = reply.toLowerCase();
    const qr: { label: string; text: string }[] = [];

    if (lower.includes('什麼服務') || lower.includes('服務項目')) {
      services.slice(0, 3).forEach((s) => {
        qr.push({ label: s.name, text: `我想預約${s.name}` });
      });
    }

    return qr.length ? qr : undefined;
  }
}
