import { ApiProperty } from '@nestjs/swagger';

export class VerifyStudentDto {
  @ApiProperty()
  roomId: number;

  @ApiProperty()
  studentId: string;
}
