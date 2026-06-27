import { Module } from '@nestjs/common';
import { AiRuleController } from './ai-rule.controller';
import { AiRuleService } from './ai-rule.service';
import { PrismaService } from '../prisma.service';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [AiAgentModule],
  controllers: [AiRuleController],
  providers: [AiRuleService, PrismaService],
  exports: [AiRuleService],
})
export class AiRuleModule {}
