import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private svc: NotificationService) {}

  // Templates
  @Get('templates')
  listTemplates(@CurrentUser() user: User) {
    return this.svc.listTemplates(user.tenantId);
  }

  @Get('templates/:id')
  getTemplate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.getTemplate(user.tenantId, id);
  }

  @Post('templates')
  createTemplate(@CurrentUser() user: User, @Body() body: any) {
    return this.svc.createTemplate(user.tenantId, body);
  }

  @Put('templates/:id')
  updateTemplate(@CurrentUser() user: User, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateTemplate(user.tenantId, id, body);
  }

  @Delete('templates/:id')
  removeTemplate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.removeTemplate(user.tenantId, id);
  }

  // Logs
  @Get('logs')
  listLogs(@CurrentUser() user: User) {
    return this.svc.listLogs(user.tenantId);
  }

  // Send
  @Post('send')
  send(@CurrentUser() user: User, @Body() body: any) {
    return this.svc.send(user.tenantId, body);
  }
}
