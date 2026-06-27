import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('date') date?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.bookingService.findAll(user.tenantId, date, staffId);
  }

  @Get('by-date')
  findByDate(
    @CurrentUser() user: User,
    @Query('date') date: string,
  ) {
    return this.bookingService.findByDate(user.tenantId, date);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() data: {
      staffId: string;
      serviceId?: string;
      customerName: string;
      customerContact?: string;
      date: string;
      startTime: string;
      endTime: string;
      note?: string;
    },
  ) {
    return this.bookingService.create({
      ...data,
      tenantId: user.tenantId,
    });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingService.updateStatus(id, status);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingService.cancel(id);
  }
}
