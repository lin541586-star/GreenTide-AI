import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
  constructor(private svc: InventoryService) {}

  /** AI 掃描辨識庫存物品 */
  @Post('ai-scan')
  aiScan(
    @CurrentUser() user: User,
    @Body() body: { imageBase64: string; mimeType: string },
  ) {
    return this.svc.aiScan(user.tenantId, body.imageBase64, body.mimeType);
  }

  /** 批次新增 AI 掃描結果 */
  @Post('ai-scan/create')
  batchCreate(
    @CurrentUser() user: User,
    @Body() body: { items: { name: string; category?: string; quantity?: number; unit?: string; price?: number }[] },
  ) {
    return this.svc.batchCreate(user.tenantId, body.items);
  }

  @Get()
  listProducts(@CurrentUser() user: User, @Query('category') category?: string) {
    return this.svc.listProducts(user.tenantId, category);
  }

  @Get('low-stock')
  lowStock(@CurrentUser() user: User) {
    return this.svc.lowStockProducts(user.tenantId);
  }

  @Get(':id')
  getProduct(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.getProduct(user.tenantId, id);
  }

  @Post()
  createProduct(@CurrentUser() user: User, @Body() body: any) {
    return this.svc.createProduct(user.tenantId, body);
  }

  @Put(':id')
  updateProduct(@CurrentUser() user: User, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateProduct(user.tenantId, id, body);
  }

  @Delete(':id')
  removeProduct(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.removeProduct(user.tenantId, id);
  }

  // Movements
  @Get(':id/movements')
  listMovements(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.listMovements(user.tenantId, id);
  }

  @Post(':id/movements')
  addMovement(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { type: string; quantity: number; note?: string }) {
    return this.svc.addMovement(user.tenantId, id, body);
  }
}
