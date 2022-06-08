import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../decorator/user.enum';

export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  birthday: Date;

  @ApiProperty({ default: true })
  gender: boolean;

  @ApiProperty({ default: UserRole.ADMIN })
  role: UserRole;

  @ApiProperty({ nullable: true })
  googleId: string;

  @ApiProperty({ required: false, nullable: true })
  imageUrl: string;

  @ApiProperty()
  password: string;
}
