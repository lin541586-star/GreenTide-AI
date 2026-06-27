import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiAgentModule } from '../ai-agent/ai-agent.module';
import { LlmModule } from '../ai-agent/llm/llm.module';
import { PrismaService } from '../prisma.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [LlmModule, TenantModule, AiAgentModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, PrismaService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
