/* eslint-disable prefer-const */
import { HttpService } from '@nestjs/axios';
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { ZoomRoom } from 'src/rooms/entities/room.entity';
import { RoomsService } from 'src/rooms/room.service';
import axios from 'axios';
import { createRequestParamString } from 'src/helpers/ultils';

@Injectable()
export class ZoomsService {
  constructor(
    private httpService: HttpService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private roomService: RoomsService,
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
  async getAccessTokenV1(code: string) {
    try {
      const params = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URL,
      };

      const response = await axios({
        url: 'https://zoom.us/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: process.env.CLIENT_ID,
          password: process.env.CLIENT_SECRET,
        },
        data: createRequestParamString(params),
      });
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async getDeeplink(accessToken) {
    return await axios({
      url: 'https://zoom.us/v2/zoomapp/deeplink',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        action: JSON.stringify({
          url: '/your/url',
          role_name: 'Owner',
          verified: 1,
          role_id: 0,
        }),
      },
    });
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
      const { meetings } = response.data;
      let list = [];
      if (meetings) {
        for (const meeting of meetings) {
          const responseMeeting = await this.getOneMeeting(
            accessToken,
            meeting.id,
          );
          const { id, topic, join_url, password, agenda } = responseMeeting;
          const room = new ZoomRoom();
          room.name = topic;
          room.zoomId = id;
          room.passcode = password;
          room.url = join_url;
          room.description = agenda;
          list.push(room);
        }
      }
      return list;
    } catch (error) {
      if (error.response.status == 401) {
        throw new UnauthorizedException('Invalid access token');
      }
      throw error;
    }
  }

  async getOneMeeting(accessToken: string, id: number) {
    try {
      const url = `https://api.zoom.us/v2/meetings/${id}`;
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
      const { id, topic, agenda, password, join_url } = response.data;
      const createRoomDto = new CreateRoomDto();
      createRoomDto.description = agenda;
      createRoomDto.name = topic;
      createRoomDto.passcode = password;
      createRoomDto.url = join_url;
      createRoomDto.zoomId = id;
      return await this.roomService.create(createRoomDto);
    } catch (error) {
      if (error.response.status == 401)
        throw new UnauthorizedException('Invalid access token');
      throw error;
    }
  }
  async getZoomAccessToken(
    zoomAuthorizationCode,
    redirect_uri = process.env.ZOOM_APP_REDIRECT_URI,
    pkceVerifier = undefined,
  ) {
    const params = {
      grant_type: 'authorization_code',
      code: zoomAuthorizationCode,
      redirect_uri,
    };

    if (typeof pkceVerifier === 'string') {
      params['code_verifier'] = pkceVerifier;
    }

    const tokenRequestParamString = createRequestParamString(params);

    return await axios({
      url: 'https://api.zoom.us/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: process.env.CLIENT_ID,
        password: process.env.CLIENT_SECRET,
      },
      data: tokenRequestParamString,
    });
  }
}
