import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LlmFactoryService } from '../ai-agent/llm/llm-factory.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private llmFactory: LlmFactoryService,
    private tenantSvc: TenantService,
  ) {}

  async listProducts(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return this.prisma.product.findMany({ where, orderBy: { name: 'asc' } });
  }

  async getProduct(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async createProduct(tenantId: string, data: { name: string; sku?: string; category?: string; quantity?: number; minStock?: number; unit?: string; price?: number; cost?: number }) {
    return this.prisma.product.create({
      data: { tenantId, ...data },
    });
  }

  async updateProduct(tenantId: string, id: string, data: any) {
    await this.getProduct(tenantId, id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async removeProduct(tenantId: string, id: string) {
    await this.getProduct(tenantId, id);
    await this.prisma.inventoryMovement.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }

  async lowStockProducts(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
    });
    return products
      .filter(p => p.quantity <= p.minStock)
      .sort((a, b) => a.quantity - b.quantity);
  }

  async listMovements(tenantId: string, productId: string) {
    await this.getProduct(tenantId, productId);
    return this.prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async addMovement(tenantId: string, productId: string, data: { type: string; quantity: number; note?: string }) {
    const product = await this.getProduct(tenantId, productId);
    const delta = data.type === 'in' ? data.quantity : -data.quantity;
    await this.prisma.product.update({
      where: { id: productId },
      data: { quantity: product.quantity + delta },
    });
    return this.prisma.inventoryMovement.create({
      data: { productId, type: data.type, quantity: data.quantity, note: data.note || null },
    });
  }

  /** AI 掃描圖片辨識庫存物品 */
  async aiScan(tenantId: string, imageBase64: string, mimeType: string): Promise<{
    raw: string;
    items: { name: string; category?: string; quantity?: number; unit?: string; price?: number }[];
  }> {
    const dbConfig = await this.tenantSvc.getEffectiveAiConfig(tenantId);
    this.llmFactory.initFromDbConfig(dbConfig);
    const provider = this.llmFactory.getProvider();
    if (!provider || !provider.visionChat) throw new Error('AI 尚未設定或不支援圖片分析');

    const prompt = `你是一個庫存管理助手。請仔細分析這張圖片中的物品，並以 JSON 陣列格式回覆，每個物品包含以下欄位：
- name（物品名稱，繁體中文）
- category（分類，從以下選擇：原料/商品/耗材/包裝/一般）
- quantity（數量，整數，若不確定則填 1）
- unit（單位，如：個/瓶/包/箱/公斤）
- price（單價，整數，若不確定則不填）

只回傳 JSON 陣列，不要加任何說明文字。
範例格式：
[{"name":"洗髮精","category":"商品","quantity":5,"unit":"瓶","price":250}]`;

    const res = await provider.visionChat(imageBase64, mimeType, prompt);
    const raw = res.text;

    // 解析 JSON
    let items: any[] = [];
    try {
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      items = JSON.parse(jsonStr);
      if (!Array.isArray(items)) throw new Error('非陣列');
    } catch {
      this.logger.warn('AI 回傳非 JSON，回傳原始文字');
      return { raw, items: [] };
    }

    return { raw, items };
  }

  /** 批次建立 AI 掃描結果中的商品 */
  async batchCreate(tenantId: string, items: { name: string; category?: string; quantity?: number; unit?: string; price?: number }[]) {
    const created = [];
    for (const item of items) {
      const product = await this.createProduct(tenantId, {
        name: item.name,
        category: item.category || '一般',
        quantity: item.quantity || 1,
        unit: item.unit || '個',
        price: item.price,
      });
      created.push(product);
    }
    return created;
  }
}
