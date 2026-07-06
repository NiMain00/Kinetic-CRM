import { Module } from '@nestjs/common';
import { RksController } from './rks.controller';
import { RksService } from './rks.service';

@Module({
  controllers: [RksController],
  providers: [RksService],
})
export class RksModule {}
