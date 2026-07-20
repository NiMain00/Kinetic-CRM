import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProspectsService } from './prospects.service';

@UseGuards(AuthGuard('jwt'))
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly service: ProspectsService) {}

  @Get()
  list(@Query() params: any, @Req() req: any) {
    return this.service.list(params, req.user);
  }

  @Get('light')
  listLight(@Query() params: any, @Req() req: any) {
    return this.service.listLight(params, req.user);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.service.get(id, req.user);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.service.create(data, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.service.update(id, data, req.user);
  }

  @Put(':id/promote')
  promote(@Param('id') id: string, @Body('level') level: string, @Req() req: any) {
    return this.service.promoteLevel(id, level, req.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.service.delete(id, req.user);
  }
}
