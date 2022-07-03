/* eslint-disable prefer-const */
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
import { formatDate, removeVietnameseTones } from 'src/helpers/ultils';
import { ConfigurationService } from 'src/config/configuration.service';
//import { join } from 'path';
const { Canvas, Image, ImageData } = canvas;
//import * as streamToBlob from 'stream-to-blob';

import '@tensorflow/tfjs-node';
import { CreateExtractDataDto } from 'src/identity_record/dto/create-extract-data.dto';
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

    const labeledFaceDescriptors = new faceapi.LabeledFaceDescriptors(
      studentId,
      images.map(
        (image) =>
          new Float32Array(
            image.faceDescriptors.match(/-?\d+(?:\.\d+)?/g).map(Number),
          ),
      ),
    );
    const config = await this.configService.getDefault();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
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

    let verifiedStatus =
      results.length == 0 ? false : results[0].label == studentId;
    if (results.length > 0)
      if (1 - results[0]?.distance < config.credibility) verifiedStatus = false;

    const createRecordDto = new CreateIdentityRecordDto();
    const room = await this.roomsService.findOne(roomId);
    createRecordDto.credibility =
      results.length > 0 ? 1 - results[0]?.distance : 0;
    createRecordDto.roomId = room.id;
    createRecordDto.studentId = studentId;
    createRecordDto.faceStatus = verifiedStatus;
    createRecordDto.faceImage = imageResult;
    const lastedRecord = await this.identiyRecordService.findLastedOne();
    if (lastedRecord)
      if (!verifiedStatus)
        createRecordDto.failTimes = lastedRecord.failTimes + 1;
      else createRecordDto.failTimes = lastedRecord.failTimes;
    const res = await this.identiyRecordService.create(createRecordDto);
    return res;
  }

  async verifyId(file: any, user: any, recordId: string, documentType: number) {
    try {
      const student = await this.studentService.findOne(user.studentId);
      let imageType = ImageType.OTHERS;

      const { extractData, errorMessages } = await this.ekycService.extractorV1(
        file,
        documentType,
      );

      let extractFields = {
        name1: '',
        name2: '',
        matchName: true,
        dob1: '',
        dob2: '',
        matchDob: true,
        studentId1: '',
        studentId2: '',
        matchStudentId: true,
      };
      let check = true;
      const extractDataDto = new CreateExtractDataDto();
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
                let name1 = extractData.predicts[0].final.name.toLowerCase();
                let name2 = (
                  student.firstName +
                  ' ' +
                  student.lastName
                ).toLowerCase();
                //console.log(name1, name2);

                name1 = name1.replace(/\s{2,}/g, ' ').trim();
                name2 = name2.replace(/\s{2,}/g, ' ').trim();
                extractDataDto.extractName = name1;
                extractDataDto.referenceName = name2;
                extractFields.name1 = name1.toUpperCase();
                const name3 = removeVietnameseTones(name2);
                if (name1 != name2 && name1 != name3) {
                  check = false;
                  extractFields.matchName = false;
                }
                if (name1 == name2) extractFields.name2 = name2.toUpperCase();
                else if (name1 == name3)
                  extractFields.name2 = name3.toUpperCase();
                else extractFields.name2 = name2.toUpperCase();

                if (!student.birthday)
                  throw new BadRequestException(
                    'Not found your birthday information in our system. Please contact your proctor!',
                  );
                extractFields.dob1 = extractData.predicts[0].final.dob;
                extractFields.dob2 = formatDate(student.birthday);
                extractDataDto.referenceDob = extractFields.dob2;
                extractDataDto.extractDob = extractFields.dob1;

                if (extractFields.dob1 != extractFields.dob2) {
                  check = false;
                  extractFields.matchDob = false;
                }

                extractFields.studentId2 = student.studentId;
                extractFields.studentId1 = extractData.predicts[0].final.id_num;
                extractDataDto.referenceStudentId = extractFields.studentId2;
                extractDataDto.extractStudentId = extractFields.studentId1;

                if (extractFields.studentId1 != extractFields.studentId2) {
                  check = false;
                  extractFields.matchStudentId = false;
                }
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
              extractFields.dob1 = extractData.predicts[0].dob;
              extractFields.dob2 = formatDate(student.birthday);
              extractDataDto.referenceDob = extractFields.dob2;
              extractDataDto.extractDob = extractFields.dob1;
              if (extractFields.dob1 != extractFields.dob2) {
                check = false;
                extractFields.matchDob = false;
              }

              if (!student.firstName || !student.lastName)
                throw new BadRequestException(
                  'Not found your name information in our system. Please contact your proctor!',
                );
              let name1 = extractData.predicts[0].name.toLowerCase();
              let name2 = (
                student.firstName +
                ' ' +
                student.lastName
              ).toLowerCase();
              name1 = name1.replace(/\s{2,}/g, ' ').trim();
              name2 = name2.replace(/\s{2,}/g, ' ').trim();
              extractDataDto.extractName = name1;
              extractDataDto.referenceName = name2;
              const name3 = removeVietnameseTones(name2);
              if (name1 == name2) extractFields.name2 = name2.toUpperCase();
              else if (name1 == name3)
                extractFields.name2 = name3.toUpperCase();
              else extractFields.name2 = name2.toUpperCase();

              if (name1 != name2 && name1 != name3) {
                check = false;
                extractFields.matchName = false;
              }
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
      const lastedRecord = await this.identiyRecordService.findLastedOne();
      let failTimes = 0;
      if (lastedRecord)
        if (!check) failTimes = lastedRecord.failTimes + 1;
        else failTimes = lastedRecord.failTimes;
      const record = await this.identiyRecordService.updateIDStatus(
        recordId,
        check,
        imageResult,
        extractDataDto,
        failTimes,
      );
      return { record, errorMessages, extractFields };
    } catch (error) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.log(error);
      throw error;
    }
  }
}
