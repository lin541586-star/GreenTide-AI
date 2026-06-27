import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { LlmModule } from './llm/llm.module';
import { PrismaService } from '../prisma.service';
import { BookingService } from '../booking/booking.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [LlmModule, TenantModule],
  providers: [AiAgentService, PrismaService, BookingService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
