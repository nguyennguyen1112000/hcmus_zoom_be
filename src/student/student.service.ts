/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { Student } from './entities/student.entity';
import * as reader from 'xlsx';
import * as fs from 'fs';
import { Connection } from 'typeorm';
import { CreateMoodleStudentDto } from './dto/create-moodle-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    private connection: Connection,
  ) {}
  async create(createStudentDto: CreateStudentDto) {
    try {
      let student = new Student();
      assignPartialsToThis(student, createStudentDto);
      await this.studentsRepository.save(student);
      return student;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async createMoodleStudent(createStudentDto: CreateMoodleStudentDto) {
    try {
      let student = new Student();
      assignPartialsToThis(student, createStudentDto);
      await this.studentsRepository.save(student);
      return student;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return await this.studentsRepository.find({ relations: ['images'] });
  }

  async findOne(studentId: string) {
    try {
      const student = await this.studentsRepository.findOne({
        where: { studentId: studentId },
        relations: ['images'],
      });

      if (!student)
        throw new BadRequestException(
          `Student with id = ${studentId} not found`,
        );
      return student;
    } catch (error) {
      throw error;
    }
  }
  async findOneWithCondition(condition) {
    try {
      const student = await this.studentsRepository.findOne({
        where: condition,
      });
      return student;
    } catch (error) {
      throw error;
    }
  }
  async findOneWithNoError(studentId: string) {
    try {
      return await this.studentsRepository.findOne({
        where: { studentId: studentId },
        relations: ['images'],
      });
    } catch (error) {
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
            studentId: res['masv'],
            firstName: res['hoten'].slice(0, res['hoten'].lastIndexOf(' ')),
            lastName: res['hoten'].slice(res['hoten'].lastIndexOf(' ')),
            birthday: new Date(
              `${res['ngaysinh'].toString().split('/')[2]}/${
                res['ngaysinh'].toString().split('/')[1]
              }/${res['ngaysinh'].toString().split('/')[0]}`,
            ),
            classCode: res['lop'],
            major: res['nganh'],
            educationLevel: res['mabac'],
            gender: res['gioitinh'] == 'Nam' ? true : false,
            email: `${res['masv']}@student.hcmus.edu.vn`,
          });
        });
      }
      fs.unlinkSync(fileLoad.path);
      await this.createMany(data);
    } catch (error) {
      if (fs.existsSync(fileLoad.path)) fs.unlinkSync(fileLoad.path);
      throw error;
    }
  }
  async createMany(list: Student[]) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      for (let i = 0; i < list.length; i++) {
        const student = new Student();
        assignPartialsToThis(student, list[i]);
        await queryRunner.manager.save(student);
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
      await queryRunner.manager.delete(Student, ids);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async updateMoodleAccount(
    studentId: string,
    username: string,
    password: string,
  ) {
    try {
      const student = await this.studentsRepository.findOne({
        where: { studentId: studentId },
      });
      if (!student)
        throw new NotFoundException(`User not found. Id = ${studentId}`);
      student.moodleUsername = username;
      student.moodlePassword = password;
      return await this.studentsRepository.save(student);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    try {
      const student = await this.studentsRepository.findOne(id);
      if (!student)
        throw new NotFoundException(`Student with id = ${id} not found`);
      assignPartialsToThis(student, updateStudentDto);
      return await this.studentsRepository.save(student);
    } catch (error) {
      throw error;
    }
  }
}
