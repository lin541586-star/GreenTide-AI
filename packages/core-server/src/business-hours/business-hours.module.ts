import { Module } from '@nestjs/common';
import { BusinessHoursController } from './business-hours.controller';
import { BusinessHoursService } from './business-hours.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BusinessHoursController],
  providers: [BusinessHoursService, PrismaService],
  exports: [BusinessHoursService],
})
export class BusinessHoursModule {}
