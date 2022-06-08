/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { Repository } from 'typeorm';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';
import * as reader from 'xlsx';
import * as fs from 'fs';
import { Connection } from 'typeorm';
import { CreateMoodleSubjectDto } from './dto/creare-moodle-subject.dto';
import { StudentsService } from 'src/student/student.service';
@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    private connection: Connection,
    private studentsService: StudentsService,
  ) {}
  async create(createSubjectDto: CreateSubjectDto) {
    try {
      let subject = new Subject();
      assignPartialsToThis(subject, createSubjectDto);

      await this.subjectsRepository.save(subject);
      return subject;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  async createMoodleSubject(createSubjectDto: CreateMoodleSubjectDto) {
    try {
      let subject = new Subject();
      assignPartialsToThis(subject, createSubjectDto);
      await this.subjectsRepository.save(subject);
      return subject;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return await this.subjectsRepository.find();
  }
  async findOne(id: number) {
    return await this.subjectsRepository.findOne(id, {
      relations: ['students'],
    });
  }
  async findOneWithCondition(condition) {
    return await this.subjectsRepository.findOne({ where: condition });
  }
  async findOneWithCode(subjectCode: string) {
    return await this.subjectsRepository.findOne({ where: { subjectCode } });
  }
  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    try {
      const subject = await this.subjectsRepository.findOne(id);
      if (!subject) throw new BadRequestException('Subject not found');
      assignPartialsToThis(subject, updateSubjectDto);
      await this.subjectsRepository.save(subject);
      return subject;
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException(err.message);
    }
  }
  async deletes(ids: number[]) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.delete(Subject, ids);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteStudents(id: number, studentIds: number[]) {
    try {
      const subject = await this.subjectsRepository.findOne(id, {
        relations: ['students'],
      });
      if (!subject) throw new NotFoundException('Subject not found');
      subject.students = subject.students.filter(
        (s) => !studentIds.some((id) => id == s.id),
      );
      await this.subjectsRepository.save(subject);
      return true;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async addStudents(id: number, studentIds: string[]) {
    try {
      const subject = await this.subjectsRepository.findOne(id, {
        relations: ['students'],
      });
      if (!subject) throw new NotFoundException('Subject not found');
      for (const id of studentIds) {
        if (!subject.students.some((s) => s.studentId == id)) {
          const currentStudent = await this.studentsService.findOneWithNoError(
            id,
          );
          if (currentStudent) subject.students.push(currentStudent);
        }
      }
      await this.subjectsRepository.save(subject);
      return true;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
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
            subjectCode: res['mamh'],
            name: res['tenmh'],
            classCode: res['lop'],
            term: res['hocki'],
            schoolYear: res['namhoc'],
            educationLevel: res['mabac'],
            examCode: res['makithi'],
            teacher: res['giangvien'],
            startTime: res['giothi'],
            examDate: new Date(
              `${res['ngaythi'].toString().split('/')[2]}/${
                res['ngaythi'].toString().split('/')[1]
              }/${res['ngaythi'].toString().split('/')[0]}`,
            ),
            examTime: res['thoigianthi'],
            studentYear: res['khoa'],
          });
        });
      }
      fs.unlinkSync(fileLoad.path);
      await this.createMany(data);
    } catch (error) {
      throw error;
    }
  }
  async uploadStudentsFile(subjectId: number, fileLoad: any) {
    try {
      const file = reader.readFile(fileLoad.path);
      let data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]],
        );
        temp.forEach((res) => {
          data.push(res['masv']);
        });
      }
      fs.unlinkSync(fileLoad.path);
      await this.addStudents(subjectId, data);
    } catch (error) {
      throw error;
    }
  }
  async createMany(list: Subject[]) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      for (let i = 0; i < list.length; i++) {
        const subject = new Subject();
        assignPartialsToThis(subject, list[i]);
        await queryRunner.manager.save(subject);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
