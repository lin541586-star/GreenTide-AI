import { Controller, Get, Patch, Put, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService, AiConfig } from './tenant.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('tenant')
@UseGuards(AuthGuard('jwt'))
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(private tenantService: TenantService) {}

  @Get()
  async getMyTenant(@CurrentUser() user: User) {
    return this.tenantService.findByUserId(user.id);
  }

  @Patch()
  async updateTenant(
    @CurrentUser() user: User,
    @Body() data: { name?: string; industry?: string },
  ) {
    const tenant = await this.tenantService.findByUserId(user.id);
    return this.tenantService.update(tenant.id, data);
  }

  @Get('ai-config')
  async getAiConfig(@CurrentUser() user: User) {
    const tenant = await this.tenantService.findByUserId(user.id);
    // 回傳給前端時隱藏完整金鑰，只顯示末4碼
    const config = await this.tenantService.getAiConfig(tenant.id);
    return {
      ...config,
      geminiApiKey: config.geminiApiKey ? `...${config.geminiApiKey.slice(-4)}` : '',
      deepseekApiKey: config.deepseekApiKey ? `...${config.deepseekApiKey.slice(-4)}` : '',
      _hasGeminiKey: !!config.geminiApiKey,
      _hasDeepSeekKey: !!config.deepseekApiKey,
    };
  }

  @Put('ai-config')
  async updateAiConfig(
    @CurrentUser() user: User,
    @Body() config: Partial<AiConfig>,
  ) {
    this.logger.log(`收到 AI 設定更新: provider=${config.provider}, 有GeminiKey=${!!config.geminiApiKey}, 有DeepSeekKey=${!!config.deepseekApiKey}, DeepSeekKey前10字=${config.deepseekApiKey?.substring(0, 10)}`);
    const tenant = await this.tenantService.findByUserId(user.id);
    return this.tenantService.updateAiConfig(tenant.id, config);
  }
}
