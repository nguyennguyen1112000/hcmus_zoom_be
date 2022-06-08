import { ApiProperty, PartialType } from '@nestjs/swagger';

export class UpdateStudentIdDto {
  @ApiProperty({ required: false, nullable: true })
  userId?: number;

  @ApiProperty()
  studentId: string;
}
