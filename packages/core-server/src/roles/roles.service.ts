import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { level: 'asc' },
    });
  }

  async create(tenantId: string, data: { name: string; level: number; permissions: string[] }) {
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: data.name } },
    });
    if (existing) throw new BadRequestException('角色名稱已存在');

    return this.prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        level: data.level,
        permissions: JSON.stringify(data.permissions),
      },
    });
  }

  async update(id: string, data: { name?: string; level?: number; permissions?: string[] }) {
    const updateData: any = { ...data };
    if (data.permissions) {
      updateData.permissions = JSON.stringify(data.permissions);
    }
    return this.prisma.role.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) throw new BadRequestException('系統預設角色不可刪除');

    // 解除使用者的角色關聯
    await this.prisma.user.updateMany({
      where: { roleId: id },
      data: { roleId: null },
    });

    return this.prisma.role.delete({ where: { id } });
  }
}
