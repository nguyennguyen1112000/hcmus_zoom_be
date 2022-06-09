import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeauthorizationService } from './deauthorization.service';
import { DeauthorizationController } from './deauthorization.controller';
import { Deauthorization } from './entities/deauthorization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deauthorization])],
  controllers: [DeauthorizationController],
  providers: [DeauthorizationService],
  exports: [DeauthorizationService],
})
export class DeauthorizationModule {}
