import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  term: string;

  @ApiProperty()
  schoolYear: string;

  @ApiProperty()
  teacher: string;

  @ApiProperty()
  classCode: string;

  @ApiProperty()
  studentYear: string;

  @ApiProperty()
  educationLevel: string;

  @ApiProperty()
  examCode: string;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  examTime: number;
}
