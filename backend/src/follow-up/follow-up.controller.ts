import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowUpService } from './follow-up.service';

@UseGuards(AuthGuard('jwt'))
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly service: FollowUpService) {}

  @Get()
  list(@Query() params: any) {
    return this.service.list(params);
  }

  @Get('by-prospect/:prospectId')
  listByProspect(@Param('prospectId') prospectId: string) {
    return this.service.listByProspect(prospectId);
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
