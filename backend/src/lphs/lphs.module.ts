import { Module } from '@nestjs/common';
import { LphsController } from './lphs.controller';
import { LphsService } from './lphs.service';

@Module({
  controllers: [LphsController],
  providers: [LphsService],
})
export class LphsModule {}
