import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  classCode: string;

  @ApiProperty()
  birthday: Date;

  @ApiProperty()
  major: string;

  @ApiProperty()
  gender: boolean;

  @ApiProperty()
  educationLevel: string;
}
