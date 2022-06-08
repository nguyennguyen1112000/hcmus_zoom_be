/* eslint-disable prefer-const */
import { HttpService } from '@nestjs/axios';
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ZoomsService {
  constructor(
    private httpService: HttpService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async getAccessToken(code: string) {
    const url =
      'https://zoom.us/oauth/token?grant_type=authorization_code&code=' +
      code +
      '&redirect_uri=' +
      process.env.REDIRECT_URL;

    const headersRequest = {
      Authorization: `Basic ${Buffer.from(
        process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET,
      ).toString('base64')}`,
    };

    const response = await this.httpService
      .post(url, null, { headers: headersRequest })
      .toPromise();
    return response.data;
  }
  async getRefreshToken(user: any) {
    const url = `https://zoom.us/oauth/token?refresh_token=${user.zoom_refresh_token}&grant_type=refresh_token`;
    const headersRequest = {
      Authorization: `Basic ${Buffer.from(
        process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET,
      ).toString('base64')}`,
    };

    const response = await this.httpService
      .post(url, null, { headers: headersRequest })
      .toPromise();
    return this.authService.generateToken(
      user,
      response.data.access_token,
      response.data.refresh_token,
    );
  }

  async profile(accessToken: string) {
    const url = 'https://api.zoom.us/v2/users/me';
    const headersRequest = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await this.httpService
      .get(url, { headers: headersRequest })
      .toPromise();
    return response.data;
  }

  async getMeetings(accessToken: string) {
    try {
      const url = 'https://api.zoom.us/v2/users/me/meetings';
      const headersRequest = {
        Authorization: `Bearer ${accessToken}`,
      };
      const response = await this.httpService
        .get(url, { headers: headersRequest })

        .toPromise();
      return response.data;
    } catch (error) {
      if (error.response.status == 401)
        throw new UnauthorizedException('Invalid access token');
      throw error;
    }
  }

  async createMeeting(data: any, token: string) {
    try {
      const url = 'https://api.zoom.us/v2/users/me/meetings';
      const headersRequest = {
        Authorization: `Bearer ${token}`,
      };
      const response = await this.httpService
        .post(url, data, { headers: headersRequest })
        .toPromise();
      console.log(response.data);

      return response.data;
    } catch (error) {
      if (error.response.status == 401)
        throw new UnauthorizedException('Invalid access token');
      throw error;
    }
  }
}
