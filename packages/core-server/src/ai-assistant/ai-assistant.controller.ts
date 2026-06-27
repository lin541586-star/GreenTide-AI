import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiAssistantService, AiChatInput } from './ai-assistant.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('ai-assistant')
@UseGuards(AuthGuard('jwt'))
export class AiAssistantController {
  constructor(
    private svc: AiAssistantService,
    private agentSvc: AiAgentService,
  ) {}

  @Post('chat')
  chat(
    @CurrentUser() user: User,
    @Body() body: Omit<AiChatInput, 'tenantId'>,
  ) {
    return this.svc.chat({ ...body, tenantId: user.tenantId });
  }

  /** AI 預約對話測試（模擬 LINE 顧客對話） */
  @Post('test-agent')
  testAgent(
    @CurrentUser() user: User,
    @Body() body: { message: string; sessionId?: string },
  ) {
    const userId = `test:${user.id}:${body.sessionId || 'default'}`;
    return this.agentSvc.processMessage({
      tenantId: user.tenantId,
      message: body.message,
      userId,
      channel: 'test',
    });
  }

  /** AI 優化應答規則文案 */
  @Post('refine-rule')
  async refineRule(
    @CurrentUser() user: User,
    @Body() body: { rule: string },
  ) {
    return this.agentSvc.refineRule(user.tenantId, body.rule);
  }

  /** 與 AI 討論應答規則 */
  @Post('chat-rule')
  async chatRule(
    @CurrentUser() user: User,
    @Body() body: { messages: { role: 'user' | 'assistant'; content: string }[] },
  ) {
    return this.agentSvc.chatRule(user.tenantId, body.messages);
  }
}
