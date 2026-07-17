import { Module } from '@nestjs/common';
import { GformController } from './gform.controller';
import { GformService } from './gform.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GformController],
  providers: [GformService],
})
export class GformModule {}
