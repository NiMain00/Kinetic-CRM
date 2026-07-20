import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MasterService } from './master.service';

const RESERVED_ENTITIES = ['customers'];

@UseGuards(AuthGuard('jwt'))
@Controller('master')
export class MasterController {
  constructor(private readonly service: MasterService) {}

  // ── Batch: all entities for master data grid ──
  @Get('all')
  listAll() {
    return this.service.listAll();
  }

  // ── Generic CRUD (menangani juga inputConfigOptions via ENTITY_MAP) ─────

  @Get(':entity')
  list(@Param('entity') entity: string, @Query() params: any) {
    if (RESERVED_ENTITIES.includes(entity)) throw new BadRequestException(`Use dedicated endpoint for ${entity}`);
    return this.service.list(entity, params);
  }

  @Get(':entity/:id')
  get(@Param('entity') entity: string, @Param('id') id: string) {
    if (RESERVED_ENTITIES.includes(entity)) throw new BadRequestException(`Use dedicated endpoint for ${entity}`);
    return this.service.get(entity, id);
  }

  @Post(':entity')
  create(@Param('entity') entity: string, @Body() data: any) {
    if (RESERVED_ENTITIES.includes(entity)) throw new BadRequestException(`Use dedicated endpoint for ${entity}`);
    return this.service.create(entity, data);
  }

  @Put(':entity/:id')
  update(@Param('entity') entity: string, @Param('id') id: string, @Body() data: any) {
    if (RESERVED_ENTITIES.includes(entity)) throw new BadRequestException(`Use dedicated endpoint for ${entity}`);
    return this.service.update(entity, id, data);
  }

  @Delete(':entity/:id')
  delete(@Param('entity') entity: string, @Param('id') id: string) {
    if (RESERVED_ENTITIES.includes(entity)) throw new BadRequestException(`Use dedicated endpoint for ${entity}`);
    return this.service.delete(entity, id);
  }
}
