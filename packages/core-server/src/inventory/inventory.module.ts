import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryAlertService } from './inventory-alert.service';
import { LlmModule } from '../ai-agent/llm/llm.module';
import { TenantModule } from '../tenant/tenant.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [LlmModule, TenantModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryAlertService, PrismaService],
  exports: [InventoryService],
})
export class InventoryModule {}
