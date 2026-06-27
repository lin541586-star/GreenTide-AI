import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingReminderService } from './booking-reminder.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingReminderService],
  exports: [BookingService],
})
export class BookingModule {}
