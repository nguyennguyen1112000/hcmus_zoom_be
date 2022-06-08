import { Module } from '@nestjs/common';
import { ImagesService } from './image.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageController } from './image.controller';
import { ImageData } from './entities/image.entity';
import { StudentsModule } from 'src/student/student.module';

@Module({
  imports: [TypeOrmModule.forFeature([ImageData]), StudentsModule],
  controllers: [ImageController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
