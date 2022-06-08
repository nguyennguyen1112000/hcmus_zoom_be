/* eslint-disable prettier/prettier */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtConstants.secret,
    });
  }
  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      studentId: payload.studentId,
      role: payload.role,
      zoom_access_token: payload.zoom_access_token,
      zoom_refresh_token: payload.zoom_refresh_token,
    };
  }
}
