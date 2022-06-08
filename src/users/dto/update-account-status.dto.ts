import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../decorator/user-status.enum';

export class UpdateAccountStatusDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  status: UserStatus;
}
