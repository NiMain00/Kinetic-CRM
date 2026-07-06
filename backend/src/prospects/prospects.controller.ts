import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProspectsService } from './prospects.service';

@UseGuards(AuthGuard('jwt'))
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly service: ProspectsService) {}

  @Get()
  list(@Query() params: any) {
    return this.service.list(params);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
