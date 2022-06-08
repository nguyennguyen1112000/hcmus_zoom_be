import { forwardRef, Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { EkycController } from './ekyc.controller';
import { EkycsService } from './ekyc.service';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigurationModule } from 'src/config/configuration.module';
@Module({
  imports: [HttpModule, forwardRef(() => AuthModule), ConfigurationModule],
  controllers: [EkycController],
  providers: [EkycsService],
  exports: [EkycsService],
})
export class EkycModule {}
