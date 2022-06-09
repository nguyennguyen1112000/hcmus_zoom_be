import { ApiProperty } from '@nestjs/swagger';

export class CreateProctorDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  staffCode: string;
}
