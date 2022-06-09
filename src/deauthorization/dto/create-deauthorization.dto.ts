import { ApiProperty } from '@nestjs/swagger';
import { DeauthorizationPayload } from './payload-deauthorization.dto';

export class CreateDeauthorizationDto {
  @ApiProperty()
  event: string;

  @ApiProperty({ type: DeauthorizationPayload })
  payload: DeauthorizationPayload;
}
