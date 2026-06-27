import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.servicesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() data: { name: string; duration: number; price?: number; priceTiers?: { label: string; price: number }[]; color?: string },
  ) {
    return this.servicesService.create(user.tenantId, data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; duration?: number; price?: number; priceTiers?: { label: string; price: number }[] | null; color?: string; active?: boolean },
  ) {
    return this.servicesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
