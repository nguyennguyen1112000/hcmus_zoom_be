/* eslint-disable prefer-const */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { SubjectsService } from 'src/subject/subject.service';
import { Brackets, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { ZoomRoom } from './entities/room.entity';
import * as reader from 'xlsx';
import * as fs from 'fs';
import { Connection } from 'typeorm';
import { ZoomsService } from 'src/zoom/zoom.service';
import { StudentsService } from 'src/student/student.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CheckInCofigType } from './decorator/config-type.enum';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/decorator/user.enum';
import { IdentityRecordService } from 'src/identity_record/identity-record.service';
import { ConfigurationService } from 'src/config/configuration.service';
@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(ZoomRoom)
    private roomsRepository: Repository<ZoomRoom>,
    private subjectService: SubjectsService,
    private connection: Connection,
    @Inject(forwardRef(() => ZoomsService))
    private zoomsService: ZoomsService,
    private studentsService: StudentsService,
    private usersService: UsersService,
    @Inject(forwardRef(() => IdentityRecordService))
    private recordService: IdentityRecordService,
    private configService: ConfigurationService,
  ) {}
  async create(createRoomDto: CreateRoomDto) {
    try {
      let room = new ZoomRoom();
      assignPartialsToThis(room, createRoomDto);
      const { subjectId } = createRoomDto;
      const subject = await this.subjectService.findOne(subjectId);
      room.subject = subject;
      await this.roomsRepository.save(room);
      return room;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll(user) {
    const query = this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')
      .leftJoinAndSelect('room.proctors', 'proctor');
    if (user.role == UserRole.PROCTOR)
      query.where('proctor.id = :proctorId', { proctorId: user.id });
    if (user.role == UserRole.STUDENT)
      query.where('student.id = :studentId', { studentId: user.id });
    const rooms = await query.getMany();
    let resRooms: any = [...rooms];
    resRooms.forEach((room) => {
      if (room.checkInStartTime && room.checkInEndTime) {
        if (
          room.checkInStartTime < new Date() &&
          room.checkInEndTime > new Date()
        )
          room.status = 'On boarding';
        else if (room.checkInStartTime > new Date())
          room.status = 'Not start yet';
        else if (room.checkInEndTime < new Date()) room.status = 'Stopped';
      } else if (room.checkInStartTime && !room.checkInEndTime)
        room.status = 'On boarding';
      else if (!room.checkInStartTime && !room.checkInEndTime)
        room.status = 'Not start yet';
    });
    return resRooms;
  }
  async findOne(id: number) {
    // const room = await this.roomsRepository.findOne({
    //   where: { id },
    //   relations: ['subject', 'students', 'proctors'],
    // });
    const room = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.proctors', 'user')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')

      .leftJoinAndSelect('student.images', 'imageData')
      .where('room.id = :id', { id })
      .getOne();
    if (!room) throw new BadRequestException('Not found room zoom');
    return room;
  }

  async findOneWithCondition(condition: any) {
    const room = await this.roomsRepository.findOne({
      where: condition,
      relations: ['subject', 'students'],
    });
    if (!room) throw new NotFoundException('Not found room zoom');
    return room;
  }

  async getCurrentRoom(
    studentId: string,
    zoomId?: string,
    passcode?: string,
    linkZoom?: string,
  ) {
    const room = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')
      .leftJoinAndSelect('student.images', 'imageData')
      .where('student.studentId = :studentId', { studentId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('room.zoomId = :zoomId AND room.passcode =:passcode', {
            zoomId,
            passcode,
          }).orWhere('room.url = :linkZoom', { linkZoom });
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'room.checkInStartTime < :currentTime AND room.checkInEndTime > :currentTime',
            {
              currentTime: new Date(),
            },
          ).orWhere(
            'room.checkInStartTime < :currentTime AND room.checkInEndTime IS NULL',
            { currentTime: new Date() },
          );
        }),
      )
      .getOne();
    if (!room)
      throw new BadRequestException(
        'Thông tin phòng zoom không chính xác hoặc chưa đến giờ định danh',
      );
    return room;
  }

  async getMyRooms(studentId: string) {
    const rooms = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')
      .leftJoinAndSelect('student.images', 'imageData')
      .where('student.studentId = :studentId', { studentId })
      .getMany();

    return rooms;
  }

  async uploadFile(fileLoad: any) {
    try {
      const file = reader.readFile(fileLoad.path);
      let data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]],
        );
        temp.forEach((res) => {
          data.push({
            name: res['tenphongthi'],
            zoomId: res['zoomid'],
            passcode: res['matkhau'],
            url: res['linkzoom'],
            roomCode: res['phongthi'],
            subjectCode: res['mamh'],
          });
        });
      }
      fs.unlinkSync(fileLoad.path);
      await this.createMany(data);
    } catch (error) {
      console.log(error.message);

      throw error;
    }
  }
  async createMany(list) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      for (let i = 0; i < list.length; i++) {
        const room = new ZoomRoom();
        assignPartialsToThis(room, list[i]);
        if (list[i].subjectCode) {
          const subject = await this.subjectService.findOneWithCode(
            list[i].subjectCode,
          );
          if (subject) room.subject = subject;
        }
        await queryRunner.manager.save(room);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async deletes(ids: number[]) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.delete(ZoomRoom, ids);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async importZoomRoom(accessToken: string) {
    return this.zoomsService.getMeetings(accessToken);
  }

  async addStudentsToRoom(roomId: number, studentIds: number[]) {
    try {
      const room = await this.roomsRepository.findOne(roomId, {
        relations: ['students'],
      });
      if (!room) throw new NotFoundException('Room not found');
      for (const id of studentIds) {
        if (!room.students.some((s) => s.id == id)) {
          const currentStudent =
            await this.studentsService.findOneWithCondition({ id: id });
          if (currentStudent) room.students.push(currentStudent);
        }
      }
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    try {
      const room = await this.roomsRepository.findOne(id, {
        relations: ['subject'],
      });
      if (!room) throw new NotFoundException(`Room with id = ${id} not found`);
      if (updateRoomDto.subjectId) {
        if (updateRoomDto.subjectId != room.subject.id) {
          const subject = await this.subjectService.findOne(
            updateRoomDto.subjectId,
          );
          room.subject = subject;
        }
      }
      assignPartialsToThis(room, updateRoomDto);
      if (updateRoomDto.checkInConfigType == CheckInCofigType.MANUAL) {
        room.checkInEndTime = null;
        room.checkInStartTime = null;
      }
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async updateSubject(id: number, subjectId: number) {
    try {
      const room = await this.roomsRepository.findOne(id);
      if (!room) throw new NotFoundException(`Room with id = ${id} not found`);
      const subject = await this.subjectService.findOne(subjectId);
      room.subject = subject;
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async addProctor(roomId: number, staffCode: string) {
    try {
      const room = await this.roomsRepository.findOne(roomId, {
        relations: ['proctors'],
      });
      if (!room)
        throw new NotFoundException(`Room with id = ${roomId} not found`);
      const user = await this.usersService.findOneWithCondition({
        role: UserRole.PROCTOR,
        staffCode: staffCode,
      });

      if (user) room.proctors.push(user);
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async deleteProctor(roomId: number, staffCode: string) {
    try {
      const room = await this.roomsRepository.findOne(roomId, {
        relations: ['proctors'],
      });
      if (!room)
        throw new NotFoundException(`Room with id = ${roomId} not found`);
      room.proctors = room.proctors.filter(
        (proctor) => proctor.staffCode != staffCode,
      );
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async deleteStudents(id: number, studentIds: number[]) {
    try {
      const subject = await this.roomsRepository.findOne(id, {
        relations: ['students'],
      });
      if (!subject) throw new NotFoundException('Room not found');
      subject.students = subject.students.filter(
        (s) => !studentIds.some((id) => id == s.id),
      );
      await this.roomsRepository.save(subject);
      return true;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async canVerify(user: any, id: number) {
    try {
      const room = await this.roomsRepository.findOne(id);
      if (!room) throw new NotFoundException('Room not found');
      let check = false;
      if (room.checkInConfigType == CheckInCofigType.AUTOMATION) {
        if (
          room.checkInStartTime <= new Date() &&
          room.checkInEndTime > new Date()
        )
          check = true;
      } else {
        if (room.checkInStartTime != null) {
          if (!room.checkInEndTime && room.checkInStartTime <= new Date())
            check = true;
          else if (
            room.checkInStartTime <= new Date() &&
            room.checkInEndTime > new Date()
          )
            check = true;
        }
      }
      const records = await this.recordService.getMyRecordsOfRoom(user, id);
      const verifySuccessCheck = records.some(
        (record) => record.faceStatus && record.idStatus,
      );
      const config = await this.configService.getDefault();
      let failExceed = false;

      if (config && config?.maxFailAttempt) {
        const failFaceCheck = records.filter(
          (record) => record.faceStatus == false,
        ).length;
        const failIdCheck = records.filter(
          (record) => record.idStatus == false,
        ).length;
        if (config.maxFailAttempt < failFaceCheck + failIdCheck)
          failExceed = true;
      }

      return {
        timeToVerify: check,
        verifySuccess: verifySuccessCheck,
        failExceed,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateCheckInTime(id: number, status: string) {
    try {
      const room = await this.roomsRepository.findOne(id);
      if (!room) throw new NotFoundException(`Room with id = ${id} not found`);
      if (status == 'stop' && room.checkInConfigType == CheckInCofigType.MANUAL)
        room.checkInEndTime = new Date();
      else if (
        status == 'start' &&
        room.checkInConfigType == CheckInCofigType.MANUAL
      ) {
        room.checkInStartTime = new Date();
        room.checkInEndTime = null;
      }
      return await this.roomsRepository.save(room);
    } catch (error) {
      throw error;
    }
  }

  async createManyFromZoom(rooms: ZoomRoom[]) {
    try {
      for (const room of rooms) {
        const currentRoom = await this.roomsRepository.findOne({
          where: { zoomId: room.zoomId },
        });
        if (currentRoom) {
          assignPartialsToThis(currentRoom, room);
          await this.roomsRepository.save(currentRoom);
        } else {
          await this.roomsRepository.save(room);
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
