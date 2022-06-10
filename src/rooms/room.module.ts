import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoomRoom } from './entities/room.entity';
import { RoomsService } from './room.service';
import { RoomsController } from './room.controller';
import { SubjectsModule } from 'src/subject/subject.module';
import { ZoomsModule } from 'src/zoom/zoom.module';
import { StudentsModule } from 'src/student/student.module';
import { UsersModule } from 'src/users/users.module';
import { IdentityRecordModule } from 'src/identity_record/indetity-record.module';
import { ConfigurationModule } from 'src/config/configuration.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([ZoomRoom]),
    SubjectsModule,
    ZoomsModule,
    StudentsModule,
    UsersModule,
    ConfigurationModule,
    forwardRef(() => IdentityRecordModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
