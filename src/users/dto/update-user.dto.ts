import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty()
  sex: boolean;

  @ApiProperty()
  birthday: Date;

  @ApiProperty({ required: false, nullable: true })
  studentId: string;
}
