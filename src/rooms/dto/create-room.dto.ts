import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  zoomId: string;

  @ApiProperty()
  passcode: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ default: '' })
  description: string;

  @ApiProperty()
  subjectId: number;
}
