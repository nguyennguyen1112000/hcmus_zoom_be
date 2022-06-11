import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UserStatus } from 'src/users/decorator/user-status.enum';
import { UpdateAccountStatusDto } from 'src/users/dto/update-account-status.dto';
import { ZoomsService } from 'src/zoom/zoom.service';
import { StudentsService } from 'src/student/student.service';
import { UserRole } from 'src/users/decorator/user.enum';
import { MoodlesService } from 'src/moodle/moodle.service';
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => ZoomsService))
    private zoomsService: ZoomsService,
    private studentService: StudentsService,
    private moodleService: MoodlesService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (
      user &&
      (await bcrypt.compare(pass, user.password)) &&
      user.status == UserStatus.ACTIVE
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateZoomUser(code: string): Promise<any> {
    const res = await this.zoomsService.getAccessToken(code);
    if (res.access_token) {
      const user = await this.zoomsService.profile(res.access_token);
      const admin = await this.usersService.findOne(user.email);
      const student = await this.studentService.findOneWithNoError(
        user.email.split('@')[0],
      );
      if (admin) {
        const { password, moodlePassword, moodleUsername, ...result } = admin;
        return {
          ...user,
          ...result,
          zoom_access_token: res.access_token,
          zoom_refresh_token: res.refresh_token,
        };
      } else if (student) {
        return {
          ...user,
          ...student,
          role: UserRole.STUDENT,
          studentId: user.email.split('@')[0],
          zoom_access_token: res.access_token,
          zoom_refresh_token: res.refresh_token,
        };
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      studentId: user.studentId,
      role: user.role,
      zoom_access_token: user.zoom_access_token,
      zoom_refresh_token: user.zoom_refresh_token,
    };
    const { zoom_access_token, zoom_refresh_token, ...result } = user;
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async loginMoodle(username: string, password: string) {
    const student = await this.moodleService.login(username, password);
    const payload = {
      email: student.email,
      sub: student.id,
      studentId: student.studentId,
      role: UserRole.STUDENT,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { ...student, role: UserRole.STUDENT },
    };
  }

  async generateToken(user: any, accessToken: string, refreshToken: string) {
    const payload = {
      ...user,
      zoom_access_token: accessToken,
      zoom_refresh_token: refreshToken,
    };
    return this.jwtService.sign(payload);
  }
}
