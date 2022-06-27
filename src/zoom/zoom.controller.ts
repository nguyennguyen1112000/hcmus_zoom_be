import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { ZoomsService } from './zoom.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';

@ApiTags('zooms')
@Controller('zooms')
export class ZoomsController {
  constructor(private readonly zoomsService: ZoomsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post('refresh_token')
  refreshToken(@GetUser() user: any) {
    return this.zoomsService.getRefreshToken(user);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post('meeting')
  createMeeting(@GetUser() user, @Body() data) {
    return this.zoomsService.createMeeting(data, user.zoom_access_token);
  }
  @Get('install')
  @Redirect()
  async authorizedCallback(@Query('code') code: string) {
    console.log('code', code);
    const { access_token } = await this.zoomsService.getAccessTokenV1(code);
    const deepLinkResponse = await this.zoomsService.getDeeplink(access_token);
    const { deeplink } = deepLinkResponse.data;
    return { url: deeplink };
  }
}
