import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { ZoomsService } from './zoom.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';
import { generateCodeVerifier, generateState } from './zoom-helpers';
import { OnAuthorizedDto } from './dto/onauthorized.dto';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('zooms')
@Controller('zooms')
export class ZoomsController {
  constructor(
    private readonly zoomsService: ZoomsService,
    private authService: AuthService,
  ) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post('refresh_token')
  refreshToken(@GetUser() user: any, @Body('isEmbedded') isEmbedded: boolean) {
    return this.zoomsService.getRefreshToken(user, isEmbedded);
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

  @Get('authorize')
  async inClientAuthorize(@Session() session: Record<string, any>) {
    console.log(
      'IN-CLIENT AUTHORIZE HANDLER ==========================================================',
      '\n',
    );
    try {
      console.log('1. Generate code verifier, code challenge and state');
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = codeVerifier;
      const zoomInClientState = generateState();
      console.log('2. Save code verifier and state to session');
      session.codeVerifier = codeVerifier;
      session.state = zoomInClientState;

      console.log('3. Return code challenge and state to frontend');
      return {
        codeChallenge,
        state: zoomInClientState,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('onauthorized')
  async inClientOnAuthorized(@Body() onAuthorizedDto: OnAuthorizedDto) {
    try {
      const { code, href, codeVerifier } = onAuthorizedDto;
      const tokenResponse = await this.zoomsService.getZoomAccessToken(
        code,
        href,
        codeVerifier,
      );

      const user = await this.authService.validateZoomUserV1(
        tokenResponse.data,
      );
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.authService.login(user);
    } catch (error) {
      throw error;
    }
  }
}
