/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { Repository } from 'typeorm';
import { CreateDeauthorizationDto } from './dto/create-deauthorization.dto';
import { Deauthorization } from './entities/deauthorization.entity';

@Injectable()
export class DeauthorizationService {
  constructor(
    @InjectRepository(Deauthorization)
    private deauthorizationRepository: Repository<Deauthorization>,
  ) {}
  async create(createDeauthorizationDto: CreateDeauthorizationDto) {
    try {
      let deauthorization = new Deauthorization();
      const {
        payload: {
          clientId,
          user_id,
          signature,
          deauthorization_time,
          account_id,
        },
      } = createDeauthorizationDto;
      deauthorization.clientId = clientId;
      deauthorization.userId = user_id;
      deauthorization.signature = signature;
      deauthorization.deauthorizationTime = deauthorization_time;
      deauthorization.accountId = account_id;
      await this.deauthorizationRepository.save(deauthorization);
      return deauthorization;
    } catch (err) {
      throw err;
    }
  }
}
