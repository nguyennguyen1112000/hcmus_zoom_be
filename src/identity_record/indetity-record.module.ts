import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityRecord } from './entities/indentity-record.entity';
import { IdentityRecordService } from './identity-record.service';
import { IdentityRecordController } from './identity-record.controller';
import { RoomsModule } from 'src/rooms/room.module';
import { ImagesModule } from 'src/image/image.module';
import { StudentsModule } from 'src/student/student.module';
import { ExtractData } from './entities/extract-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdentityRecord, ExtractData]),
    forwardRef(() => RoomsModule),
    ImagesModule,
  ],
  controllers: [IdentityRecordController],
  providers: [IdentityRecordService],
  exports: [IdentityRecordService],
})
export class IdentityRecordModule {}
