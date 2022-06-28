import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Session,
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
  async inClientOnAuthorized(
    @Session() session: Record<string, any>,
    @Body() onAuthorizedDto: OnAuthorizedDto,
  ) {
    console.log(
      'IN-CLIENT ON AUTHORIZED TOKEN HANDLER ==========================================================',
      '\n',
    );
    const zoomAuthorizationCode = onAuthorizedDto.code;
    const href = onAuthorizedDto.href;
    const state = decodeURIComponent(onAuthorizedDto.state);
    const zoomInClientState = session.state;
    const codeVerifier = session.codeVerifier;

    console.log(
      '1. Verify code (from onAuthorized event in client) exists and state matches',
    );

    try {
      if (!zoomAuthorizationCode || state !== zoomInClientState) {
        throw new Error('State mismatch');
      }

      console.log('2. Getting Zoom access token and user', '\n');
      const tokenResponse = await this.zoomsService.getZoomAccessToken(
        zoomAuthorizationCode,
        href,
        codeVerifier,
      );

      const zoomAccessToken = tokenResponse.data.access_token;
      console.log(
        '2a. Use code to get Zoom access token - response data: ',
        tokenResponse.data,
        '\n',
      );

      console.log('2b. Get Zoom user from Zoom API with access token');
      const userResponse = await this.zoomsService.profile(zoomAccessToken);
      const zoomUserId = userResponse.id;
      session.user = zoomUserId;

      console.log(
        '2c. Use access token to get Zoom user - response data: ',
        userResponse,
        '\n',
      );

      console.log(
        '2d. Save the tokens in the store so we can look them up when the Zoom App is opened',
      );

      // 2c. Save the tokens in the store so we can look them up when the Zoom App is opened:
      // When the home url for the app is requested on app open in the Zoom client,
      // the user id (uid field) is in the decrypted x-zoom-app-context header of the GET request

      return { result: 'Success' };
    } catch (error) {
      throw error;
    }
  }
}
