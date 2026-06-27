import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { PluginLoaderModule } from './plugin-loader/plugin-loader.module';
import { PluginDiscoveryService } from './plugin-loader/plugin-discovery.service';
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { BookingModule } from './booking/booking.module';
import { DatabaseModule } from './database.module';
import { LineModule } from './channels/line/line.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { LlmModule } from './ai-agent/llm/llm.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { RolesModule } from './roles/roles.module';
import { UsersAdminModule } from './users-admin/users-admin.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CrmModule } from './crm/crm.module';
import { NotificationModule } from './notification/notification.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { AiRuleModule } from './ai-rule/ai-rule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 每分鐘最多100次請求
      },
    ]),
    CommonModule,
    AuthModule,
    TenantModule,
    PluginLoaderModule,
    ServicesModule,
    StaffModule,
    BookingModule,
    DatabaseModule,
    LlmModule,
    AiAgentModule,
    LineModule,
    BusinessHoursModule,
    RolesModule,
    UsersAdminModule,
    DashboardModule,
    CrmModule,
    NotificationModule,
    InventoryModule,
    AnalyticsModule,
    AiAssistantModule,
    AiRuleModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {
  constructor(private readonly pluginDiscovery: PluginDiscoveryService) {
    this.pluginDiscovery.loadAllPlugins();
  }
}
