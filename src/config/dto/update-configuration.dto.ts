import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateConfigurationDto } from './create-configuration.dto';

export class UpdateConfigurationDto extends PartialType(
  CreateConfigurationDto,
) {
  @ApiProperty()
  ekycToken: string;
}
