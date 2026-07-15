import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { MasterModule } from './master/master.module';
import { CustomersModule } from './customers/customers.module';
import { ProjectsModule } from './projects/projects.module';
import { ProspectsModule } from './prospects/prospects.module';
import { RksModule } from './rks/rks.module';
import { LphsModule } from './lphs/lphs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigModule } from './config/config.module';
import { ApprovalsModule } from './approvals/approvals.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    RbacModule,
    AuditModule,
    NotificationModule,
    CustomersModule,
    MasterModule,
    ProjectsModule,
    ProspectsModule,
    RksModule,
    LphsModule,
    DashboardModule,
    ConfigModule,
    ApprovalsModule,
  ],
})
export class AppModule {}
