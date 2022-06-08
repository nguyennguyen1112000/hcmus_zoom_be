import { forwardRef, Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ZoomsController } from './zoom.controller';
import { ZoomsService } from './zoom.service';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [HttpModule, forwardRef(() => AuthModule)],
  controllers: [ZoomsController],
  providers: [ZoomsService],
  exports: [ZoomsService],
})
export class ZoomsModule {}
