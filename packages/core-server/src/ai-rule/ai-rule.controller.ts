import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiRuleService } from './ai-rule.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('ai-rules')
@UseGuards(AuthGuard('jwt'))
export class AiRuleController {
  constructor(private svc: AiRuleService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAll(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: { rule: string; sortOrder?: number }) {
    return this.svc.create(user.tenantId, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() body: any) {
    return this.svc.update(id, user.tenantId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.svc.remove(id, user.tenantId);
  }
}
