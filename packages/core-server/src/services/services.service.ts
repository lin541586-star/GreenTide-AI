import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface PriceTier {
  label: string;
  price: number;
}

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'asc' },
    });
    return services.map((s) => ({
      ...s,
      priceTiers: s.priceTiers ? JSON.parse(s.priceTiers) : null,
    }));
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('服務項目不存在');
    return {
      ...service,
      priceTiers: service.priceTiers ? JSON.parse(service.priceTiers) : null,
    };
  }

  async create(tenantId: string, data: { name: string; duration: number; price?: number; priceTiers?: PriceTier[]; color?: string }) {
    return this.prisma.service.create({
      data: {
        name: data.name,
        duration: data.duration,
        price: data.price,
        priceTiers: data.priceTiers ? JSON.stringify(data.priceTiers) : null,
        color: data.color,
        tenantId,
      },
    });
  }

  async update(id: string, data: { name?: string; duration?: number; price?: number; priceTiers?: PriceTier[] | null; color?: string; active?: boolean }) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.priceTiers !== undefined) {
      updateData.priceTiers = data.priceTiers ? JSON.stringify(data.priceTiers) : null;
    }
    return this.prisma.service.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: { active: false },
    });
  }
}
