import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from 'src/student/student.module';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { Configuration } from './entities/configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration]), StudentsModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
