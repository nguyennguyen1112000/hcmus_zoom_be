/* eslint-disable prefer-const */
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import * as FormData from 'form-data';
import * as request from 'request';
import { ConfigurationService } from 'src/config/configuration.service';
import * as fs from 'fs';
@Injectable()
export class EkycsService {
  constructor(
    private httpService: HttpService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private configService: ConfigurationService,
  ) {}

  async login(username: string, password: string) {
    try {
      const data = {
        username,
        password,
      };
      const url = process.env.EKYC_API;
      return new Promise((resolve, reject) => {
        request.post(
          `${url}/user/login`,
          { form: data },
          function (error, response, body) {
            if (body) resolve(body);
          },
        );
      });
    } catch (error) {
      console.log(error.message);

      throw error;
    }
  }
  async classify(file: any, token): Promise<any> {
    try {
      const url = process.env.EKYC_API;
      return new Promise((resolve, reject) => {
        request.post(
          {
            url: `${url}/doc/classify`,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
            },
          },
          function (error, response, body) {
            if (body) resolve(body);
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async extractor(file: any): Promise<any> {
    try {
      const config = await this.configService.getDefault();
      const url = process.env.EKYC_API;
      const checkVal = await this.checkVal(file, config.ekycToken);

      if (checkVal.predicts) {
        if (checkVal.photocopy && checkVal.photocopy == 6)
          throw new BadRequestException(
            'Photo taken is a photocopy, taken via screen',
          );
        if (checkVal.iluminate) {
          switch (checkVal.iluminatie) {
            case 3:
              throw new BadRequestException('The photo is too bright');
            case 4:
              throw new BadRequestException('The photo is too dark');
            case 5:
              throw new BadRequestException('The photo is too blurred');
            default:
              break;
          }
        }
        if (checkVal.face && checkVal.face == 7)
          throw new BadRequestException('No face found');
      }
      const fileType = await this.classify(file, config.ekycToken);
      let type = -1;
      if (fileType.predicts) {
        switch (fileType?.predicts) {
          case 'front_cmtnd':
            type = 1;
            break;
          case 'front_cccd':
            type = 3;
            break;
          default:
            break;
        }
      }

      return new Promise((resolve, reject) => {
        request.post(
          {
            url: `${url}/doc/crop_extract`,
            headers: {
              Authorization: `Bearer ${config.ekycToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
              doc_type: type,
            },
          },
          function (error, response, body) {
            resolve(body);
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async checkVal(file: any, token): Promise<any> {
    try {
      const url = process.env.EKYC_API;

      return new Promise((resolve, reject) => {
        request.post(
          {
            url: `${url}/doc/checkval`,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
              options: ['face', 'photocopy', 'iluminate'],
            },
            json: true,
          },
          function (error, response, body) {
            resolve(body);
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }
}
