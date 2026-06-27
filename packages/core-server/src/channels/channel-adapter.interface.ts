/**
 * Channel Adapter 抽象介面
 * 統一 LINE / FB / IG 等不同渠道的收發訊息
 */
export interface ChannelMessage {
  /** 渠道類型: line | fb | ig */
  source: string;
  /** 使用者在該渠道的唯一 ID */
  userId: string;
  /** 訊息內容 */
  text: string;
  /** 原始事件內容（debug 用） */
  raw?: any;
}

export interface ChannelSendOptions {
  /** 回覆的對象（通常是使用者 ID） */
  replyTo?: string;
  /** 是否為快速回覆（按鈕選項） */
  quickReply?: { label: string; text: string }[];
}

export interface IChannelAdapter {
  /** 渠道名稱 */
  readonly name: string;
  /** 驗證並解析 webhook 請求 */
  parseWebhook(body: any, headers: Record<string, string>): Promise<ChannelMessage[]>;
  /** 傳送訊息給使用者 */
  sendMessage(userId: string, text: string, options?: ChannelSendOptions): Promise<void>;
}
