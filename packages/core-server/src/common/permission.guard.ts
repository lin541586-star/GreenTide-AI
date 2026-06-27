import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permission.decorator';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 沒有設定權限要求 → 允許
    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未登入');
    }

    // owner 角色全部允許
    if (user.role === 'owner') return true;

    // 查詢使用者關聯的角色
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roleDef: true },
    });

    if (!dbUser?.roleDef) {
      throw new ForbiddenException('未分配權限角色');
    }

    const userPermissions: string[] = JSON.parse(dbUser.roleDef.permissions);

    // 萬用權限 *
    if (userPermissions.includes('*')) return true;

    // 檢查是否擁有所有必要權限
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('權限不足');
    }

    return true;
  }
}
