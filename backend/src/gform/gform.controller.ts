import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { GformService } from './gform.service';
import { GformWebhookDto } from './dto/gform-webhook.dto';
import { RateLimiterGuard } from '../common/rate-limiter.guard';

@Controller('gform')
export class GformController {
  constructor(private readonly service: GformService) {}

  @Post('webhook')
  @UseGuards(new RateLimiterGuard(10, 60_000))
  async webhook(
    @Body() payload: GformWebhookDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.service.processWebhook(payload, apiKey);
  }
}
