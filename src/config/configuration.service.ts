/* eslint-disable prefer-const */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { Repository } from 'typeorm';
import { CreateConfigurationDto } from './dto/create-configuration.dto';

import { Configuration } from './entities/configuration.entity';

import { UpdateConfigurationDto } from './dto/update-configuration.dto';
@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private configurationsRepository: Repository<Configuration>,
  ) {}
  async create(createConfigurationDto: CreateConfigurationDto) {
    try {
      let config = new Configuration();
      assignPartialsToThis(config, createConfigurationDto);

      await this.configurationsRepository.save(config);
      return config;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getDefault() {
    const configs = await this.configurationsRepository.find();
    if (configs.length > 0) return configs[0];
    return null;
  }

  async update(updateConfigurationDto: UpdateConfigurationDto) {
    try {
      let config = null;
      const configs = await this.configurationsRepository.find();
      if (configs.length > 0) config = configs[0];
      if (config) {
        assignPartialsToThis(config, updateConfigurationDto);
        await this.configurationsRepository.save(config);
        return config;
      }
    } catch (err) {
      throw err;
    }
  }
}
