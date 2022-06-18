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
import { Student } from 'src/student/entities/student.entity';
import { ImageType } from 'src/image/decorator/image-type.enum';
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
            if (body) resolve(JSON.parse(body));
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async extractor(file: any): Promise<any> {
    try {
      let errorMessages = [];
      const config = await this.configService.getDefault();
      const predictStudentID = await this.predictStudentId(file);
      let isStudentID = false;
      if (predictStudentID.predicts) {
        if (predictStudentID.predicts.length > 0)
          if (predictStudentID.predicts[0].conf > 0.8) isStudentID = true;
      }

      if (!isStudentID) {
        const checkVal = await this.checkVal(file, config.ekycToken);
        if (checkVal.predicts) {
          if (checkVal.predicts.photocopy && checkVal.predicts.photocopy == 6)
            errorMessages.push('Photo taken is a photocopy, taken via screen');

          if (checkVal.predicts.iluminate) {
            switch (checkVal.predicts.iluminate) {
              case 3:
                errorMessages.push('The photo is too bright');
              case 4:
                errorMessages.push('The photo is too dark');
              case 5:
                errorMessages.push('The photo is too blurred');
              default:
                break;
            }
          }
          if (checkVal.predicts.face && checkVal.predicts.face == 7)
            errorMessages.push('Not found any face in verification document');
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
        if (type == -1)
          throw new BadRequestException(
            'Unable to determine verification document type',
          );
        return {
          extractData: await this.extractId(file, type, config.ekycToken),
          errorMessages,
        };
      } else {
        const checkValFace = await this.checkValFace(file, config.ekycToken);

        if (checkValFace.predicts) {
          if (checkValFace.face && checkValFace.face == 7)
            errorMessages.push('Not found any face in verification document');
        }
        return {
          extractData: await this.extractStudentId(file),
          errorMessages,
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async extractorV1(file: any, documentType: number): Promise<any> {
    try {
      let errorMessages = [];
      const config = await this.configService.getDefault();

      if (documentType != 0) {
        const checkVal = await this.checkVal(file, config.ekycToken);
        if (checkVal.predicts) {
          if (checkVal.predicts.photocopy && checkVal.predicts.photocopy == 6)
            errorMessages.push('Photo taken is a photocopy, taken via screen');

          if (checkVal.predicts.iluminate) {
            switch (checkVal.predicts.iluminate) {
              case 3:
                errorMessages.push('The photo is too bright');
              case 4:
                errorMessages.push('The photo is too dark');
              case 5:
                errorMessages.push('The photo is too blurred');
              default:
                break;
            }
          }
          if (checkVal.predicts.face && checkVal.predicts.face == 7)
            errorMessages.push('Not found any face in verification document');
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
        if (type == -1)
          throw new BadRequestException(
            'Unable to determine verification document type',
          );
        return {
          extractData: await this.extractId(
            file,
            documentType,
            config.ekycToken,
          ),
          errorMessages,
        };
      } else {
        const predictStudentID = await this.predictStudentId(file);
        if (predictStudentID.predicts) {
          if (predictStudentID.predicts.length > 0) {
            if (predictStudentID.predicts[0].conf < 0.8)
              errorMessages.push(
                'Not found any student id document in your image',
              );
            else
              errorMessages.push(
                'Not found any student id document in your image',
              );
          } else
            errorMessages.push(
              'Not found any student id document in your image',
            );
        } else
          errorMessages.push('Not found any student id document in your image');

        const checkValFace = await this.checkValFace(file, config.ekycToken);

        if (checkValFace.predicts) {
          if (checkValFace.face && checkValFace.face == 7)
            errorMessages.push('Not found any face in verification document');
        }
        return {
          extractData: await this.extractStudentId(file),
          errorMessages,
        };
      }
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

  async checkValFace(file: any, token): Promise<any> {
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
              options: ['face'],
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

  async predictStudentId(file: any): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        request.post(
          {
            url: 'https://aiclub.uit.edu.vn/gpu/service/thesv/field/predict_binary',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
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

  async extractStudentId(file: any): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        request.post(
          {
            url: 'https://aiclub.uit.edu.vn/student_idcard/predict_binary',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
            },
            json: true,
          },
          function (error, response, body) {
            resolve({ ...body, type: ImageType.STUDENT_CARD });
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async extractId(file: any, type: number, token: string): Promise<any> {
    try {
      const url = process.env.EKYC_API;
      return new Promise((resolve, reject) => {
        request.post(
          {
            url: `${url}/doc/crop_extract`,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            formData: {
              binary_file: fs.createReadStream(file.path),
              doc_type: type,
            },
          },
          function (error, response, body) {
            resolve({ ...JSON.parse(body), type: ImageType.ID_CARD });
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }
}
