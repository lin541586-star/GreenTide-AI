import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { LineService } from './line.service';
import { AiAgentService } from '../../ai-agent/ai-agent.service';

@Controller('channels/line')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);

  constructor(
    private readonly lineService: LineService,
    private readonly aiAgent: AiAgentService,
  ) {}

  /**
   * LINE Webhook 入口
   * 路由範例: POST /api/channels/line/webhook/:tenantId
   */
  @Post('webhook/:tenantId')
  @HttpCode(200)
  async handleWebhook(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      const messages = await this.lineService.parseWebhook(body, headers);

      for (const msg of messages) {
        const replyToken = msg.raw?.replyToken;
        if (!replyToken) continue;

        // 交給 AI Agent 處理
        const { reply, quickReply } = await this.aiAgent.processMessage({
          tenantId,
          message: msg.text,
          userId: msg.userId,
          channel: 'line',
        });

        // 回覆 LINE 使用者
        await this.lineService.replyMessage(replyToken, reply, quickReply);
      }
    } catch (err: any) {
      this.logger.error(`Webhook 處理失敗: ${err.message}`);
    }

    // LINE 要求一律回傳 200
    return {};
  }
}
