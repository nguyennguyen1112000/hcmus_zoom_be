import { ApiProperty } from '@nestjs/swagger';

export class DeauthorizationPayload {
  @ApiProperty()
  account_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  deauthorization_time: Date;

  @ApiProperty()
  clientId: string;
}
