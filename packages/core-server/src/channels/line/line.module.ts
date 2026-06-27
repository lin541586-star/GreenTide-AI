import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { LineWebhookController } from './line-webhook.controller';
import { AiAgentModule } from '../../ai-agent/ai-agent.module';

@Module({
  imports: [AiAgentModule],
  controllers: [LineWebhookController],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
