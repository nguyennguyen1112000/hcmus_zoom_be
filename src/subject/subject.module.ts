import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from 'src/student/student.module';
import { Subject } from './entities/subject.entity';
import { SubjectsService } from './subject.service';
import { SubjectsController } from './subjects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject]), StudentsModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
