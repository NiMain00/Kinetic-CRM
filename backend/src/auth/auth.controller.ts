import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: { username: string; password: string }) {
    return this.authService.login(dto.username, dto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any) {
    const tokenJti = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.authService.logout(req.user.id, tokenJti);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.me(req.user.id);
  }
}
