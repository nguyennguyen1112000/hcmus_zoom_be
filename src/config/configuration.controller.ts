import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { ConfigurationService } from './configuration.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
@ApiTags('configuration')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}
  @Get()
  async getConfiguration() {
    return this.configService.getDefault();
  }

  @Put()
  async update(@Body() updateConfigurationDto: UpdateConfigurationDto) {
    return this.configService.update(updateConfigurationDto);
  }
}
