import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersAdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        roleDef: { select: { id: true, name: true, level: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    tenantId: string,
    data: { email: string; password: string; name: string; roleId?: string },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('此 Email 已被使用');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'staff',
        roleId: data.roleId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        roleDef: { select: { id: true, name: true, level: true } },
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; roleId?: string | null; active?: boolean; password?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('使用者不存在');

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        roleDef: { select: { id: true, name: true, level: true } },
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('使用者不存在');
    if (user.role === 'owner') throw new ConflictException('無法刪除店家管理員');

    // 軟刪除
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }
}
