import { forwardRef, Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ZoomsController } from './zoom.controller';
import { ZoomsService } from './zoom.service';
import { AuthModule } from 'src/auth/auth.module';
import { RoomsModule } from 'src/rooms/room.module';
@Module({
  imports: [
    HttpModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RoomsModule),
  ],
  controllers: [ZoomsController],
  providers: [ZoomsService],
  exports: [ZoomsService],
})
export class ZoomsModule {}
