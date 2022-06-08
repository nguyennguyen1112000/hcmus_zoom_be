import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { ZoomsService } from './zoom.service';
import { GetUser } from 'src/users/decorator/user.decorator';

@ApiTags('zooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('zooms')
export class ZoomsController {
  constructor(private readonly zoomsService: ZoomsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('refresh_token')
  refreshToken(@GetUser() user: any) {
    return this.zoomsService.getRefreshToken(user);
  }
  @Post('meeting')
  createMeeting(@GetUser() user, @Body() data) {
    return this.zoomsService.createMeeting(data, user.zoom_access_token);
  }
}
