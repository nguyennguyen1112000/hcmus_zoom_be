/* eslint-disable @typescript-eslint/no-empty-function */
import { BadRequestException, Injectable } from '@nestjs/common';
import * as faceapi from '@vladmandic/face-api';
import fetch from 'node-fetch';
import * as canvas from 'canvas';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { RoomsService } from 'src/rooms/room.service';
import * as fs from 'fs';
import { IdentityRecordService } from 'src/identity_record/identity-record.service';
import { CreateIdentityRecordDto } from 'src/identity_record/dto/create-identity-record.dto';
import { ImagesService } from 'src/image/image.service';
import { ImageType } from 'src/image/decorator/image-type.enum';
import { EkycsService } from 'src/ekyc/ekyc.service';
import { StudentsService } from 'src/student/student.service';
import { formatDate } from 'src/helpers/ultils';
import { ConfigurationService } from 'src/config/configuration.service';
//import { join } from 'path';
const { Canvas, Image, ImageData } = canvas;
//import * as streamToBlob from 'stream-to-blob';

//import '@tensorflow/tfjs-node';
// Make face-api.js use that fetch implementation
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch } as any);
@Injectable()
export class VerifyService {
  constructor(
    private roomsService: RoomsService,
    private identiyRecordService: IdentityRecordService,
    private studentService: StudentsService,
    private imageService: ImagesService,
    private ekycService: EkycsService,
    private configService: ConfigurationService,
  ) {}
  async verify(file: any, verifyStudentDto: VerifyStudentDto, images) {
    const { roomId, studentId } = verifyStudentDto;
    const MODEL_URL = './models';
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromDisk(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
    //Fetch images

    const labeledFaceDescriptors = await Promise.all(
      [studentId].map(async (label) => {
        const descriptions = [];
        await Promise.all(
          images.map(async (image) => {
            const img = await canvas.loadImage(
              `./public/images/${image.imageId}.jpg`,
            );

            const detections = await faceapi
              .detectSingleFace(img as any)
              .withFaceLandmarks()
              .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }),
        );

        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      }),
    );
    const config = await this.configService.getDefault();
    const faceMatcher = new faceapi.FaceMatcher(
      labeledFaceDescriptors,
      config.credibility ? config.credibility : 0.6,
    );
    const currentImage = await canvas.loadImage(file.path);

    const displaySize = { width: 640, height: 480 };
    const detections = await faceapi
      .detectAllFaces(currentImage as any)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor),
    );
    //fs.unlinkSync(file.path);

    const imageResult = await this.imageService.createIdentiyResultImage(
      file,
      ImageType.FACE_RESULT,
    );

    images.forEach((img) => {
      fs.unlinkSync(`./public/images/${img.imageId}.jpg`);
    });

    const verifiedStatus =
      results.length == 0 ? false : results[0].label == studentId;
    const createRecordDto = new CreateIdentityRecordDto();
    const room = await this.roomsService.findOne(roomId);
    createRecordDto.credibility = 1 - results[0]?.distance;
    createRecordDto.roomId = room.id;
    createRecordDto.studentId = studentId;
    //createRecordDto.zoomEmail = '18120486@student.hcmus.edu.vn';
    createRecordDto.faceStatus = verifiedStatus;
    createRecordDto.faceImage = imageResult;
    const res = await this.identiyRecordService.create(createRecordDto);
    return res;
  }

  async verifyId(file: any, user: any, recordId: string) {
    try {
      const student = await this.studentService.findOne(user.studentId);
      let imageType = ImageType.OTHERS;
      const extractData = await this.ekycService.extractor(file);
      console.log(extractData);
      let check = true;
      if (extractData) {
        if (extractData.type == ImageType.STUDENT_CARD) {
          imageType = ImageType.STUDENT_CARD;
          if (extractData.predicts) {
            if (extractData.predicts.length > 0) {
              if (extractData.predicts[0].final) {
                if (!student.firstName || !student.lastName)
                  throw new BadRequestException(
                    'Not found your name information in our system. Please contact your proctor!',
                  );
                const name1 = extractData.predicts[0].final.name.toLowerCase();
                const name2 = (
                  student.firstName +
                  ' ' +
                  student.lastName
                ).toLowerCase();
                //console.log(name1, name2);

                name1.replace(/\s{2,}/g, ' ').trim();
                name2.replace(/\s{2,}/g, ' ').trim();
                if (name1 != name2) check = false;
                if (!student.birthday)
                  throw new BadRequestException(
                    'Not found your birthday information in our system. Please contact your proctor!',
                  );
                if (
                  extractData.predicts[0].final.dob !=
                  formatDate(student.birthday)
                )
                  check = false;
                // console.log(
                //   extractData.predicts[0].final.dob,
                //   formatDate(student.birthday),
                // );

                if (student.studentId != extractData.predicts[0].final.id_num)
                  check = false;
                // console.log(
                //   student.studentId,
                //   extractData.predicts[0].final.id_num,
                // );
              }
            } else check = false;
          } else check = false;
        } else if (extractData.type == ImageType.ID_CARD) {
          imageType = ImageType.ID_CARD;
          if (extractData.predicts) {
            if (extractData.predicts.length > 0) {
              if (!student.birthday)
                throw new BadRequestException(
                  'Not found your birthday information in our system. Please contact your proctor!',
                );
              if (extractData.predicts[0].dob != formatDate(student.birthday))
                check = false;
              // console.log(
              //   extractData.predicts[0].dob,
              //   formatDate(student.birthday),
              // );
              if (!student.firstName || !student.lastName)
                throw new BadRequestException(
                  'Not found your name information in our system. Please contact your proctor!',
                );
              const name1 = extractData.predicts[0].name.toLowerCase();
              const name2 = (
                student.firstName +
                ' ' +
                student.lastName
              ).toLowerCase();
              //console.log(name1, name2);
              name1.replace(/\s{2,}/g, ' ').trim();
              name2.replace(/\s{2,}/g, ' ').trim();
              if (name1 != name2) check = false;
            } else check = false;
          } else check = false;
        } else check = false;
      }
      const imageResult = await this.imageService.createIdentiyResultImage(
        file,
        imageType,
      );
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return await this.identiyRecordService.updateIDStatus(
        recordId,
        check,
        imageResult,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
