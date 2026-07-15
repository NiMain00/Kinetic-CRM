import { Controller, Get, Patch, Post, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('type') type?: string,
    @Query('read') read?: string,
  ) {
    return this.notificationService.list(req.user.id, {
      page,
      perPage,
      type,
      read: read !== undefined ? read === 'true' : undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.notificationService.create(dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.delete(id, req.user.id);
  }
}
