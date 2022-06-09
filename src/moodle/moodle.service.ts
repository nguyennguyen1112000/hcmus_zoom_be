/* eslint-disable prefer-const */
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMoodleStudentDto } from 'src/student/dto/create-moodle-student.dto';
import { StudentsService } from 'src/student/student.service';
import { CreateMoodleSubjectDto } from 'src/subject/dto/creare-moodle-subject.dto';
import { SubjectsService } from 'src/subject/subject.service';
import { UserRole } from 'src/users/decorator/user.enum';
import { UsersService } from 'src/users/users.service';
import { CreateConnectDto } from './dto/create-connect.dto';
import { Connection } from 'typeorm';
@Injectable()
export class MoodlesService {
  constructor(
    private httpService: HttpService,
    private usersService: UsersService,
    private studentsService: StudentsService,
    private subjectsService: SubjectsService,
    private connection: Connection,
  ) {}

  async connect(user: any, createConnectDto: CreateConnectDto) {
    try {
      const { moodleUsername, moodlePassword } = createConnectDto;
      const url = `https://courses.fit.hcmus.edu.vn/login/token.php?service=moodle_mobile_app&username=${moodleUsername}&password=${moodlePassword}`;

      const response = await this.httpService.post(url).toPromise();
      if (response.data.token) {
        const { userid } = await this.getUserInfo(response.data.token);
        return await this.usersService.updateMoodleAccount(
          user.id,
          userid,
          moodleUsername,
          moodlePassword,
        );
        // } else if (user.role == UserRole.STUDENT)
        //   return await this.studentsService.updateMoodleAccount(
        //     user.studentId,
        //     moodleUsername,
        //     moodlePassword,
        //   );
      } else throw new BadRequestException('Username or password is invalid');
    } catch (error) {
      throw error;
    }
  }

  async login(moodleUsername: string, moodlePassword: string) {
    try {
      const url = `https://courses.fit.hcmus.edu.vn/login/token.php?service=moodle_mobile_app&username=${moodleUsername}&password=${moodlePassword}`;

      const response = await this.httpService.post(url).toPromise();
      if (response.data.token) {
        const student = await this.studentsService.findOne(moodleUsername);
        return student;
      } else throw new UnauthorizedException();
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
  async getToken(username: string, password: string) {
    try {
      const url = `https://courses.fit.hcmus.edu.vn/login/token.php?service=moodle_mobile_app&username=${username}&password=${password}`;
      const response = await this.httpService.post(url).toPromise();
      return response.data;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async getUserInfo(token: string) {
    const url = 'https://courses.fit.hcmus.edu.vn/webservice/rest/server.php';
    const userInfo = await this.httpService
      .get(url, {
        params: {
          wstoken: token,
          wsfunction: 'core_webservice_get_site_info',
          moodlewsrestformat: 'json',
        },
      })
      .toPromise();
    return userInfo.data;
  }
  async syncSubjects(user) {
    try {
      if (user.role == UserRole.PROCTOR || user.role == UserRole.ADMIN) {
        const url =
          'https://courses.fit.hcmus.edu.vn/webservice/rest/server.php';
        const { token } = await this.getToken(
          user.moodleUsername,
          user.moodlePassword,
        );
        const { userid } = await this.getUserInfo(token);
        const courses = await this.httpService
          .get(url, {
            params: {
              wstoken: token,
              wsfunction: 'core_enrol_get_users_courses',
              moodlewsrestformat: 'json',
              userid: userid,
            },
          })
          .toPromise();
        for (const course of courses.data) {
          const currentCourse = await this.subjectsService.findOneWithCondition(
            {
              moodleId: course.id,
            },
          );
          if (!currentCourse) {
            const usersInCourse = await this.httpService
              .get(url, {
                params: {
                  wstoken: token,
                  wsfunction: 'core_enrol_get_enrolled_users',
                  moodlewsrestformat: 'json',
                  courseid: course.id,
                },
              })
              .toPromise();
            let teachers = usersInCourse.data.filter((user) =>
              user.roles?.some((role) => role.roleid == 3),
            );
            teachers = teachers?.map((teacher) => teacher.fullname);
            const createSubjectDto = new CreateMoodleSubjectDto();
            createSubjectDto.moodleId = course.id;
            createSubjectDto.name = course.shortname;
            createSubjectDto.teacher = teachers.join(', \n');
            createSubjectDto.startDate = course.startdate
              ? new Date(course.startdate)
              : null;
            await this.subjectsService.createMoodleSubject(createSubjectDto);
          }
        }
        return true;
      }
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async syncStudentInSubjects(user: any, subjectId: number) {
    try {
      const subject = await this.subjectsService.findOne(subjectId);
      if (!subject) throw new NotFoundException('Subject not found');
      if (!subject.moodleId)
        throw new BadRequestException('MoodleId not found');
      const url = 'https://courses.fit.hcmus.edu.vn/webservice/rest/server.php';
      const { token } = await this.getToken(
        user.moodleUsername,
        user.moodlePassword,
      );
      const usersInCourse = await this.httpService
        .get(url, {
          params: {
            wstoken: token,
            wsfunction: 'core_enrol_get_enrolled_users',
            moodlewsrestformat: 'json',
            courseid: subject.moodleId,
          },
        })
        .toPromise();

      let students = usersInCourse.data.filter((user) =>
        user.roles?.some((role) => role.roleid == 5),
      );
      for (const stu of students) {
        if (stu.email) {
          const currentStudent =
            await this.studentsService.findOneWithCondition({
              email: stu.email,
            });
          //Nếu không có student thì tạo mới
          if (!currentStudent) {
            const createStudentDto = new CreateMoodleStudentDto();
            createStudentDto.email = stu.email;
            const nameArr = stu.fullname?.split(' ');
            const lastName = nameArr[nameArr.length - 1];
            nameArr.pop();
            const firstName = nameArr.join(' ');
            createStudentDto.firstName = firstName;
            createStudentDto.lastName = lastName;
            createStudentDto.moodleId = stu.id;
            createStudentDto.studentId = stu.email?.split('@')[0];
            const student = await this.studentsService.createMoodleStudent(
              createStudentDto,
            );
            if (!subject.students.some((s) => s.email == stu.email)) {
              subject.students.push(student);
              await this.connection.manager.save(subject);
            }
          } else {
            if (!subject.students.some((s) => s.email == stu.email)) {
              subject.students.push(currentStudent);
              await this.connection.manager.save(subject);
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
}
