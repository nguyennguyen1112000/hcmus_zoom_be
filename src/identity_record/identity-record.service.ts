/* eslint-disable prefer-const */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { query } from 'express';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { ImageData } from 'src/image/entities/image.entity';
import { ImagesService } from 'src/image/image.service';
import { RoomsService } from 'src/rooms/room.service';
import { StudentsService } from 'src/student/student.service';
import { UserRole } from 'src/users/decorator/user.enum';

import { Repository } from 'typeorm';
import { CreateExtractDataDto } from './dto/create-extract-data.dto';
import { CreateIdentityRecordDto } from './dto/create-identity-record.dto';
import { StudentJoinRoomDto } from './dto/student-join-roomdto';
import { ExtractData } from './entities/extract-data.entity';
import { IdentityRecord } from './entities/indentity-record.entity';
import { StudentJoinRoom } from './entities/student-join-room.entity';
@Injectable()
export class IdentityRecordService {
  constructor(
    @InjectRepository(IdentityRecord)
    private recordRepository: Repository<IdentityRecord>,
    @Inject(forwardRef(() => RoomsService))
    private roomService: RoomsService,
    private imageService: ImagesService,
    @InjectRepository(ExtractData)
    private extractRepository: Repository<ExtractData>,
    @InjectRepository(StudentJoinRoom)
    private studentJointRoomRepository: Repository<StudentJoinRoom>,
  ) {}
  async create(createRecordDto: CreateIdentityRecordDto) {
    try {
      const { roomId, faceImage } = createRecordDto;
      const room = await this.roomService.findOne(roomId);
      let record = new IdentityRecord();
      assignPartialsToThis(record, createRecordDto);
      record.room = room;
      record.faceImage = faceImage;
      // if (cardImageId) {
      //   const cardImage = await this.imageService.getFile(cardImageId);
      //   record.cardImage = cardImage;
      // }

      await this.recordRepository.save(record);
      return record;
    } catch (err) {
      console.log(err);

      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return await this.recordRepository.find({
      relations: ['room'],
    });
  }
  async findOne(id: string) {
    const record = await this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.room', 'room')
      .leftJoinAndSelect('record.faceImage', 'faceImage')
      .leftJoinAndSelect('record.cardImage', 'cardImage')
      .leftJoinAndSelect('room.subject', 'subject')
      .where('record.id = :id', { id })
      .getOne();
    if (!record) throw new NotFoundException('Not found record');
    return record;
  }
  async findLastedOne() {
    const records = await this.recordRepository.find({
      order: { created_at: 'DESC' },
    });
    if (records.length > 0) return records[0];
    return null;
  }

  async updateIDStatus(
    id: string,
    idStatus: boolean,
    image: ImageData,
    extractDataDto: CreateExtractDataDto,
  ) {
    try {
      const record = await this.recordRepository.findOne(id);
      const extract = new ExtractData();
      assignPartialsToThis(extract, extractDataDto);
      const saveExtract = await this.extractRepository.save(extract);
      if (!record) throw new NotFoundException('Not found record');
      if (record.cardImage)
        await this.imageService.deleteImage(record.cardImage.id);
      record.idStatus = idStatus;
      record.cardImage = image;
      record.duration = new Date().getTime() - record.created_at.getTime();
      record.extractData = saveExtract;
      if (!record.idStatus) record.failTimes = record.failTimes + 1;
      if (idStatus) record.accepted = true;
      return await this.recordRepository.save(record);
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(
    roomId: number,
    studentId: string,
    accepted: boolean,
    note: string,
  ) {
    try {
      const records = await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .where('room.id = :roomId', { roomId: roomId })
        .andWhere('identity.studentId = :studentId', { studentId: studentId })
        .orderBy('identity.created_at', 'DESC')
        .getMany();
      records.forEach((record) => {
        if (note) record.note = note;
        record.accepted = accepted;
      });
      return await this.recordRepository.save(records);
    } catch (error) {
      throw error;
    }
  }

  async getMyRecordsOfRoom(user: any, roomId: number) {
    try {
      let query = await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .where('room.id = :roomId', { roomId: roomId })
        .andWhere('identity.studentId = :studentId', {
          studentId: user.studentId,
        })
        .orderBy('identity.created_at', 'DESC');

      return query.getMany();
    } catch (error) {
      console.log(error.message);
    }
  }

  async getAllInRoom(roomId: number) {
    try {
      return await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .where('room.id = :roomId', { roomId: roomId })
        .orderBy('identity.created_at', 'ASC')
        .getMany();
    } catch (error) {
      console.log(error.message);
    }
  }

  async getAll(user: any) {
    try {
      const query = this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('room.subject', 'subject')
        .leftJoinAndSelect('room.proctors', 'proctor')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .orderBy('identity.created_at', 'DESC');
      if (user.role == UserRole.PROCTOR)
        query.andWhere('proctor.id = :userId', { userId: user.id });
      const records = await query.getMany();
      const merged = records.reduce((r, { studentId, roomId, ...rest }) => {
        const key = `${roomId}-${studentId}`;
        r[key] = r[key] || {
          roomId,
          studentId,
          identityRecords: [],
        };
        r[key]['identityRecords'].push(rest);
        return r;
      }, {});
      let results: any = Object.values(merged);
      results = results.map(
        (r) =>
          (r = { ...r, ...r.identityRecords[0], identityRecords: undefined }),
      );
      return results;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async getAllByRoom(user: any, id: number) {
    try {
      const query = this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('room.subject', 'subject')
        .leftJoinAndSelect('room.proctors', 'proctor')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .where('room.id = :roomId', { roomId: id })
        .orderBy('identity.created_at', 'DESC');
      if (user.role == UserRole.PROCTOR)
        query.andWhere('proctor.id = :userId', { userId: user.id });
      const records = await query.getMany();
      const merged = records.reduce((r, { studentId, ...rest }) => {
        const key = `${studentId}`;
        r[key] = r[key] || {
          studentId,
          identityRecords: [],
        };
        r[key]['identityRecords'].push(rest);
        return r;
      }, {});
      let results: any = Object.values(merged);
      results = results.map(
        (r) =>
          (r = { ...r, ...r.identityRecords[0], identityRecords: undefined }),
      );
      const room = await this.roomService.findOne(id);
      const students = room.students;
      results.forEach((record) => {
        if (record.faceStatus && record.idStatus) {
          record.status = 'Passed';
        } else if (record.faceStatus && record.idStatus == null) {
          record.status = 'Face passed';
        } else if (record.faceStatus && record.idStatus == false) {
          record.status = 'Failed';
        }
      });
      students.forEach((student) => {
        if (!results.some((record) => record.studentId == student.studentId))
          results.push({
            studentId: student.studentId,
            status: 'Not start yet',
          });
      });
      //Kiểm tra đã vào phòng chưa
      // for (const record of results) {
      //   const joinRoom = await this.studentJointRoomRepository.findOne({
      //     where: { studentId: record.studentId, roomId: id },
      //   });
      //   if (joinRoom) {
      //     record.joinedRoom = true;
      //     record.joinedRoomTime = joinRoom.joinTime;
      //   }
      // }
      return results;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async getAllByRoomAndStudent(roomId: number, studentId: string) {
    try {
      const records = await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'faceImage')
        .leftJoinAndSelect('identity.cardImage', 'cardImage')
        .leftJoinAndSelect('identity.extractData', 'extractData')
        .where('room.id = :roomId', { roomId: roomId })
        .andWhere('identity.studentId = :studentId', { studentId: studentId })
        .orderBy('identity.created_at', 'DESC')
        .getMany();

      return records;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
  async deletes(ids: string[]) {
    try {
      for (const id of ids) {
        const record = await this.recordRepository.findOne(id);
        if (record) {
          if (record.faceImage)
            await this.imageService.deleteImage(record.faceImage.id);
          if (record.cardImage)
            await this.imageService.deleteImage(record.cardImage.id);
          await this.recordRepository.remove(record);
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
  async studentJoinRoom(studentJoinRoom: StudentJoinRoomDto) {
    try {
      const { email, zoomRoomId } = studentJoinRoom;
      const studentId = email.split('@')[0];
      const room = await this.roomService.findOneWithCondition({
        zoomId: zoomRoomId,
      });
      const existed = await this.studentJointRoomRepository.findOne({
        where: { studentId, roomId: room.id },
      });
      if (!existed) {
        const newStudentJoinRoom = new StudentJoinRoom();
        newStudentJoinRoom.roomId = room.id;
        newStudentJoinRoom.studentId = studentId;
        return this.studentJointRoomRepository.save(newStudentJoinRoom);
      }
    } catch (error) {
      throw error;
    }
  }
}
