import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateDeauthorizationDto } from './dto/create-deauthorization.dto';

import { DeauthorizationService } from './deauthorization.service';

@ApiTags('deauthorization')
@Controller('deauthorization')
export class DeauthorizationController {
  constructor(
    private readonly deauthorizationService: DeauthorizationService,
  ) {}

  @Post()
  deauthorization(
    @Body(new ValidationPipe({ transform: true }))
    createDeauthorizationDto: CreateDeauthorizationDto,
  ) {
    return this.deauthorizationService.create(createDeauthorizationDto);
  }
}
