import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RoomsModule } from './rooms/room.module';
import { VerifyModule } from './identity/verify.module';

import { SubjectsModule } from './subject/subject.module';
import { StudentsModule } from './student/student.module';
import { ImagesModule } from './image/image.module';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ZoomsModule } from './zoom/zoom.module';
import { AppGateway } from './app.gateway';
import { MoodlesModule } from './moodle/moodle.module';
import { EkycModule } from './ekyc/ekyc.module';
import { ContactModule } from './contact/contact.module';
@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(),
    AuthModule,
    RoomsModule,
    VerifyModule,
    SubjectsModule,
    StudentsModule,
    ImagesModule,
    HttpModule,
    ZoomsModule,
    MoodlesModule,
    EkycModule,
    ConfigModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
