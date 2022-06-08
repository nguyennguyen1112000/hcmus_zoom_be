import { ApiProperty } from '@nestjs/swagger';

export class CreateMoodleSubjectDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  moodleId: number;

  @ApiProperty()
  teacher: string;

  @ApiProperty()
  startDate: Date;
}
