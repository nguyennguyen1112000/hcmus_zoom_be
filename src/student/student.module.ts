import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './student.service';
import { StudentsController } from './student.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
