import { ApiProperty } from '@nestjs/swagger';

export class CreateConnectDto {
  @ApiProperty()
  moodleUsername: string;

  @ApiProperty()
  moodlePassword: string;
}
