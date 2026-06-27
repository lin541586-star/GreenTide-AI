import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AiConfig {
  provider: string;
  geminiApiKey: string;
  geminiModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
  tone: string;
  allowEmoji: boolean;
  lineChannelSecret: string;
  lineAccessToken: string;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new NotFoundException('使用者不存在');
    return user.tenant;
  }

  async update(tenantId: string, data: { name?: string; industry?: string; plan?: string }) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async getAiConfig(tenantId: string): Promise<AiConfig> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('店家不存在');
    return JSON.parse(tenant.aiConfig || '{}') as AiConfig;
  }

  async updateAiConfig(tenantId: string, config: Partial<AiConfig>) {
    const current = await this.getAiConfig(tenantId);
    const merged = { ...current, ...config };
    this.logger.log(`儲存 AI 設定: provider=${merged.provider}, 有GeminiKey=${!!merged.geminiApiKey}, 有DeepSeekKey=${!!merged.deepseekApiKey}, DeepSeekKey長度=${merged.deepseekApiKey?.length || 0}`);
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { aiConfig: JSON.stringify(merged) },
    });
    const saved = JSON.parse(tenant.aiConfig);
    this.logger.log(`儲存後確認: 有GeminiKey=${!!saved.geminiApiKey}, 有DeepSeekKey=${!!saved.deepseekApiKey}, DeepSeekKey長度=${saved.deepseekApiKey?.length || 0}`);
    return saved;
  }

  /** 取出 aiConfig 同時結合 .env 降級（若 DB 未設則回退 .env） */
  async getEffectiveAiConfig(tenantId: string): Promise<AiConfig> {
    const dbConfig = await this.getAiConfig(tenantId);
    return {
      provider: dbConfig.provider || process.env.LLM_PROVIDER || 'gemini',
      geminiApiKey: dbConfig.geminiApiKey || process.env.GEMINI_API_KEY || '',
      geminiModel: dbConfig.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      deepseekApiKey: dbConfig.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '',
      deepseekModel: dbConfig.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      deepseekBaseUrl: dbConfig.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      tone: dbConfig.tone || 'professional',
      allowEmoji: dbConfig.allowEmoji ?? false,
      lineChannelSecret: dbConfig.lineChannelSecret || '',
      lineAccessToken: dbConfig.lineAccessToken || '',
    };
  }
}
