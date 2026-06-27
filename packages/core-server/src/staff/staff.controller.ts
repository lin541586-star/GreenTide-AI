import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService } from './staff.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('staff')
@UseGuards(AuthGuard('jwt'))
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.staffService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() data: { name: string; title?: string; bio?: string; color?: string },
  ) {
    return this.staffService.create(user.tenantId, data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; title?: string; bio?: string; color?: string; active?: boolean },
  ) {
    return this.staffService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
