/* eslint-disable prefer-const */
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { UserStatus } from './decorator/user-status.enum';
import { UserRole } from 'src/users/decorator/user.enum';
import { assignPartialsToThis, generateProctorCode } from 'src/helpers/ultils';
import { Connection } from 'typeorm';
import * as reader from 'xlsx';
import * as fs from 'fs';
import { CreateProctorDto } from './dto/create-proctor.dto';
import { UpdateProctorDto } from './dto/update-proctor.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private connection: Connection,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const {
        email,
        firstName,
        lastName,
        password,
        role,
        gender,
        googleId,
        imageUrl,
        birthday,
      } = createUserDto;
      const account = await this.usersRepository.findOne({
        where: { email: email },
      });
      if (account) throw new BadRequestException('Email account existed');
      let user = new User();
      if (password) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);
        user.password = hash;
      } else if (googleId) {
        user.googleId = googleId;
      }
      if (!googleId) user.status = UserStatus.PENDING;

      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.gender = gender;
      user.role = role;
      user.birthday = birthday;
      if (imageUrl) user.imageUrl = imageUrl;
      const saveUser = await this.usersRepository.save(user);
      return saveUser;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findOne(email: string) {
    return await this.usersRepository.findOne({ where: { email: email } });
  }
  async findOneWithCondition(condition: any) {
    return await this.usersRepository.findOne({ where: condition });
  }

  async updateMoodleAccount(
    id: number,
    moodleId: string,
    username: string,
    password: string,
  ) {
    try {
      const user = await this.usersRepository.findOne(id);
      if (!user) throw new NotFoundException(`User not found. Id = ${id}`);
      user.moodleUsername = username;
      user.moodlePassword = password;
      user.moodleId = moodleId;
      return await this.usersRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  async createProctors(emails: string[]) {
    try {
      for (const email of emails) {
        const user = await this.usersRepository.findOne({
          where: { email: email },
        });
        if (!user) {
          const newUser = new User();
          newUser.email = email;
          newUser.role = UserRole.PROCTOR;
          newUser.staffCode = generateProctorCode();
          await this.usersRepository.save(newUser);
        }
      }
      return true;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async addProctor(createProctorDto: CreateProctorDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: { email: createProctorDto.email },
      });
      if (!user) {
        const newUser = new User();
        assignPartialsToThis(newUser, createProctorDto);
        newUser.role = UserRole.PROCTOR;
        newUser.status = UserStatus.PENDING;
        return await this.usersRepository.save(newUser);
      } else {
        user.role = UserRole.PROCTOR;
        return await this.usersRepository.save(user);
      }
    } catch (err) {
      throw err;
    }
  }

  async updateProctor(id: number, updateProctorDto: UpdateProctorDto) {
    try {
      const user = await this.usersRepository.findOne(id, {
        where: { role: UserRole.PROCTOR },
      });
      if (!user) {
        throw new NotFoundException('Not found proctor');
      } else {
        assignPartialsToThis(user, updateProctorDto);
        return await this.usersRepository.save(user);
      }
    } catch (err) {
      throw err;
    }
  }

  async getAll(type?: UserRole) {
    const query = await this.usersRepository.createQueryBuilder('user');
    if (type) query.where('user.role = :role', { role: type });
    return query.getMany();
  }

  async deleteProctors(ids: number[]) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      const proctors = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: ids })
        .andWhere('user.role = :role', { role: UserRole.PROCTOR })
        .getMany();
      const proctorIds = proctors.map((x) => x.id);
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.delete(User, proctorIds);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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
            staffCode: res['macb'],
            email: res['email'],
            firstName: res['hoten'].slice(0, res['hoten'].lastIndexOf(' ')),
            lastName: res['hoten'].slice(res['hoten'].lastIndexOf(' ')),
            status: UserStatus.PENDING,
            role: UserRole.PROCTOR,
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
        const currentUser = await this.usersRepository.findOne({
          email: list[i].email,
        });
        if (!currentUser) {
          const user = new User();
          assignPartialsToThis(user, list[i]);
          await queryRunner.manager.save(user);
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // async canUpdateStudentId(userId: number, studentId: string) {
  //   const user = await this.usersRepository.findOne({ studentId });
  //   if (user && user.id != userId) return false;
  //   return true;
  // }
  // async updateStudentId(
  //   currentUser: User,
  //   updateStudentIdDto: UpdateStudentIdDto,
  // ) {
  //   try {
  //     const { studentId, userId } = updateStudentIdDto;

  //     let userToUpdate;
  //     if (currentUser.role == UserRole.ADMIN) {
  //       if (!(await this.canUpdateStudentId(userId, studentId)))
  //         throw new BadRequestException(`MSSV đã tồn tại`);
  //       userToUpdate = await this.findById(userId);
  //     } else {
  //       if (!(await this.canUpdateStudentId(currentUser.id, studentId)))
  //         throw new BadRequestException(`MSSV đã tồn tại`);
  //       userToUpdate = await this.findById(currentUser.id);
  //     }
  //     userToUpdate.studentId = studentId;
  //     await this.usersRepository.save(userToUpdate);
  //   } catch (error) {
  //     console.log(error.message);
  //     throw error;
  //   }
  // }

  // async updateAccountStatus(
  //   currentUser: User,
  //   updateAccountStatusDto: UpdateAccountStatusDto,
  // ) {
  //   try {
  //     const { userId, status } = updateAccountStatusDto;
  //     if (userId == currentUser.id && currentUser.role == UserRole.ADMIN)
  //       throw new ForbiddenException(
  //         'Admin không thể cập nhật trạng thái của mình',
  //       );
  //     const userToUpdate = await this.findById(userId);
  //     userToUpdate.status = status;
  //     await this.usersRepository.save(userToUpdate);
  //   } catch (error) {
  //     console.log(error.message);
  //     throw error;
  //   }
  // }
}
