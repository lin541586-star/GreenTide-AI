import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('此 Email 已被註冊');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 使用指定店家名稱或預設名稱
    const tenantName = dto.tenantName || `${dto.name}的店舖`;

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName, industry: 'other', plan: 'free' },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: 'owner',
        },
      });

      return { tenant, user };
    });

    const token = this.generateToken(result.user.id, result.tenant.id, result.user.role);
    const { password, ...userWithoutPassword } = result.user;

    return {
      accessToken: token,
      user: userWithoutPassword,
      tenant: result.tenant,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email 或密碼錯誤');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email 或密碼錯誤');
    if (!user.active) throw new UnauthorizedException('帳號已停用');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant || !tenant.active) throw new UnauthorizedException('店家已停用');

    const token = this.generateToken(user.id, tenant.id, user.role);
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken: token,
      user: userWithoutPassword,
      tenant,
    };
  }

  private generateToken(userId: string, tenantId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, tenantId, role });
  }
}
