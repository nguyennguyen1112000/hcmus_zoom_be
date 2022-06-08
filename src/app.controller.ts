/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}
  @Get()
  sayAPI() {
    return 'API is running';
  }
  @Get('/token/:code')
  async getTokens(@Param('code') code: string) {
    const response = await this.appService.getAccessToken(code);
    return response;
  }
  @Post('/profile')
  async profile(@Body('accessToken') accessToken: string) {
    const response = await this.appService.profile(accessToken);
    return response;
  }
}
