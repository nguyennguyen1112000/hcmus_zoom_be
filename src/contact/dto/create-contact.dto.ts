import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  message: string;
}
