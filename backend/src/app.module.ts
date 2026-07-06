import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { CustomersModule } from './customers/customers.module';
import { ProjectsModule } from './projects/projects.module';
import { ProspectsModule } from './prospects/prospects.module';
import { RksModule } from './rks/rks.module';
import { LphsModule } from './lphs/lphs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RbacModule,
    AuditModule,
    NotificationModule,
    CustomersModule,
    ProjectsModule,
    ProspectsModule,
    RksModule,
    LphsModule,
  ],
})
export class AppModule {}
