import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser, resolveSalonId } from '../../common/utils/resolve-salon-id';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@CurrentUser() user: RequestUser) {
    const salonId = resolveSalonId(user);
    const connected = await this.googleCalendarService.isConnected(salonId);
    return { connected };
  }

  @Get('auth')
  auth(@Query('state') salonId: string, @Res() res: Response) {
    const url = this.googleCalendarService.getAuthUrl(salonId);
    res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') salonId: string,
    @Res() res: Response,
  ) {
    await this.googleCalendarService.handleCallback(code, salonId);
    res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/parametres?google=connected`);
  }

  @Get('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@CurrentUser() user: RequestUser) {
    const salonId = resolveSalonId(user);
    await this.googleCalendarService.disconnect(salonId);
    return { disconnected: true };
  }
}
