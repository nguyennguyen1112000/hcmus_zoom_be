import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { MoodlesService } from './moodle.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { CreateConnectDto } from './dto/create-connect.dto';
import { UsersService } from 'src/users/users.service';

@ApiTags('moodles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('moodles')
export class MoodleController {
  constructor(
    private readonly moodlesService: MoodlesService,
    private usersService: UsersService,
  ) {}
  @Post('connect')
  async connectMoodle(
    @GetUser() user,
    @Body() createConnectDto: CreateConnectDto,
  ) {
    return await this.moodlesService.connect(user, createConnectDto);
  }
  @Post('sync')
  async syncData(@GetUser() user) {
    const currentUser = await this.usersService.findOne(user.email);
    return await this.moodlesService.syncSubjects(currentUser);
  }
  @Post('sync/subject/:id/students')
  async syncStudentsInCourses(@GetUser() user, @Param() id: number) {
    const currentUser = await this.usersService.findOne(user.email);
    return await this.moodlesService.syncStudentInSubjects(currentUser, id);
  }
}
