/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class CredentialDto {
  // @ApiProperty()
  // email: string;

  // @ApiProperty()
  // password: string;
  @ApiProperty()
  code: string;
}
