import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@UseGuards(AuthGuard('jwt'))
@Controller('master/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  list(@Query('page') page?: number, @Query('search') search?: string, @Query('type') type?: string) {
    return this.service.list({ page, search, type });
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
