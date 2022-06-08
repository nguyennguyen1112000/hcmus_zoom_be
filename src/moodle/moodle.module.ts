import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { MoodleController } from './moodle.controller';
import { MoodlesService } from './moodle.service';
import { StudentsModule } from 'src/student/student.module';
import { UsersModule } from 'src/users/users.module';
import { SubjectsModule } from 'src/subject/subject.module';
@Module({
  imports: [HttpModule, StudentsModule, UsersModule, SubjectsModule],
  controllers: [MoodleController],
  providers: [MoodlesService],
  exports: [MoodlesService],
})
export class MoodlesModule {}
