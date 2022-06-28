/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class OnAuthorizedDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  href: string;

  @ApiProperty()
  codeVerifier: string;
}
