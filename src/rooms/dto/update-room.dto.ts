import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CheckInCofigType } from '../decorator/config-type.enum';
import { CreateRoomDto } from './create-room.dto';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiProperty()
  checkInStartTime: Date;
  @ApiProperty()
  checkInEndTime: Date;
  @ApiProperty()
  checkInConfigType: CheckInCofigType;
}
