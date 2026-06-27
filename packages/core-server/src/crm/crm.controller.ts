import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrmService } from './crm.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('crm')
@UseGuards(AuthGuard('jwt'))
export class CrmController {
  constructor(private crm: CrmService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('search') search?: string) {
    return this.crm.list(user.tenantId, search);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.crm.getById(user.tenantId, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: { name: string; phone?: string; email?: string; notes?: string; tags?: string[] }) {
    return this.crm.create(user.tenantId, body);
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() body: any) {
    return this.crm.update(user.tenantId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.crm.remove(user.tenantId, id);
  }
}
