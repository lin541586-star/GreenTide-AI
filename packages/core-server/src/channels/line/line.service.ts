import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LineBotClient, validateSignature } from '@line/bot-sdk';
import { IChannelAdapter, ChannelMessage, ChannelSendOptions } from '../channel-adapter.interface';

@Injectable()
export class LineService implements IChannelAdapter {
  private readonly logger = new Logger(LineService.name);
  readonly name = 'line';

  private client: LineBotClient | null = null;
  private channelSecret: string;

  constructor(private config: ConfigService) {
    this.channelSecret = this.config.get('LINE_CHANNEL_SECRET', '');
    const token = this.config.get('LINE_CHANNEL_ACCESS_TOKEN', '');
    if (this.channelSecret && token) {
      this.client = LineBotClient.fromChannelAccessToken({ channelAccessToken: token });
      this.logger.log('LINE Messaging API 客戶端已初始化');
    } else {
      this.logger.warn('LINE 憑證未設定，LINE Bot 功能未啟用');
    }
  }

  /** 驗證並解析 LINE Webhook 請求 */
  async parseWebhook(body: any, headers: Record<string, string>): Promise<ChannelMessage[]> {
    const signature = headers['x-line-signature'] || '';
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);

    if (!validateSignature(rawBody, this.channelSecret, signature)) {
      throw new Error('LINE 簽章驗證失敗');
    }

    const events = body.events || [];
    return events
      .filter((ev: any) => ev.type === 'message' && ev.message?.type === 'text')
      .map((ev: any) => ({
        source: 'line' as const,
        userId: ev.source?.userId || ev.source?.groupId || 'unknown',
        text: ev.message.text,
        raw: { replyToken: ev.replyToken, event: ev },
      }));
  }

  /** 傳送訊息給 LINE 使用者 */
  async sendMessage(userId: string, text: string, options?: ChannelSendOptions): Promise<void> {
    if (!this.client) {
      this.logger.warn('LINE 客戶端未初始化，無法發送訊息');
      return;
    }

    const msg: any = { type: 'text', text };
    if (options?.quickReply?.length) {
      msg.quickReply = {
        items: options.quickReply.map((q) => ({
          type: 'action',
          action: { type: 'message', label: q.label, text: q.text },
        })),
      };
    }

    await this.client.pushMessage({ to: userId, messages: [msg] });
  }

  /** 回覆訊息（使用 replyToken） */
  async replyMessage(replyToken: string, text: string, quickReply?: { label: string; text: string }[]): Promise<void> {
    if (!this.client) return;

    const msg: any = { type: 'text', text };
    if (quickReply?.length) {
      msg.quickReply = {
        items: quickReply.map((q) => ({
          type: 'action',
          action: { type: 'message', label: q.label, text: q.text },
        })),
      };
    }

    await this.client.replyMessage({ replyToken, messages: [msg] });
  }
}
