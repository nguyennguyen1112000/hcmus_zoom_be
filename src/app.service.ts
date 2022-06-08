/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

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
}
