import { ApiProperty } from '@nestjs/swagger';

export class StudentJoinRoomDto {
  @ApiProperty()
  email?: string;
  @ApiProperty()
  zoomRoomId?: string;
}
