import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { PermissionGuard } from './permission.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class CommonModule {}
