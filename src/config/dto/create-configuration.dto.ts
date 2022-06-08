import { ApiProperty } from '@nestjs/swagger';

export class CreateConfigurationDto {
  @ApiProperty()
  ekycUsername: string;

  @ApiProperty()
  ekycPassword: string;

  // @ApiProperty()
  // ekycToken: string;
}
