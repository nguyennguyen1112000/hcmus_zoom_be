import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProctorDto } from './create-proctor.dto';

export class UpdateProctorDto extends PartialType(CreateProctorDto) {
  @ApiProperty()
  birthday: Date;

  @ApiProperty({ default: true })
  gender: boolean;
}
