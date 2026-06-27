import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';

@Injectable()
export class AiRuleService {
  private readonly logger = new Logger(AiRuleService.name);

  constructor(
    private prisma: PrismaService,
    private agentSvc: AiAgentService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.aiRule.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActive(tenantId: string) {
    return this.prisma.aiRule.findMany({
      where: { tenantId, enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(tenantId: string, data: { rule: string; sortOrder?: number }) {
    const max = await this.prisma.aiRule.findFirst({
      where: { tenantId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    // 建立時先儲存原始規則
    const rule = await this.prisma.aiRule.create({
      data: {
        tenantId,
        rule: data.rule,
        sortOrder: data.sortOrder ?? (max ? max.sortOrder + 1 : 0),
      },
    });
    // 非同步自動優化規則（不阻塞回傳）
    this.autoRefine(tenantId, rule.id, data.rule);
    return rule;
  }

  async update(id: string, tenantId: string, data: { rule?: string; enabled?: boolean; sortOrder?: number }) {
    const rule = await this.prisma.aiRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('規則不存在');
    await this.prisma.aiRule.update({ where: { id }, data });
    // 如果規則內容有變，非同步自動優化
    if (data.rule && data.rule !== rule.rule) {
      this.autoRefine(tenantId, id, data.rule);
    }
    return this.prisma.aiRule.findUnique({ where: { id } });
  }

  /** 非同步自動優化規則並儲存 refinedRule（不消耗後續 token） */
  private async autoRefine(tenantId: string, ruleId: string, original: string) {
    try {
      const { refined } = await this.agentSvc.refineRule(tenantId, original);
      if (refined && refined !== original) {
        await this.prisma.aiRule.update({
          where: { id: ruleId },
          data: { refinedRule: refined },
        });
        this.logger.log(`規則 ${ruleId} 已自動優化`);
      }
    } catch (err: any) {
      this.logger.warn(`規則 ${ruleId} 自動優化失敗（跳過）: ${err.message}`);
    }
  }

  async remove(id: string, tenantId: string) {
    const rule = await this.prisma.aiRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('規則不存在');
    return this.prisma.aiRule.delete({ where: { id } });
  }
}
