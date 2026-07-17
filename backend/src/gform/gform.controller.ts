import { Controller, Post, Body, Headers } from '@nestjs/common';
import { GformService } from './gform.service';

@Controller('gform')
export class GformController {
  constructor(private readonly service: GformService) {}

  @Post('webhook')
  async webhook(
    @Body() payload: any,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.service.processWebhook(payload, apiKey);
  }
}
