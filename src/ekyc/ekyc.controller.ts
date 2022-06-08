import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { EkycsService } from './ekyc.service';
import { GetUser } from 'src/users/decorator/user.decorator';

@ApiTags('ekyc')
//@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('ekyc')
export class EkycController {
  constructor(private readonly ekycService: EkycsService) {}
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@ApiBearerAuth('JWT-auth')
  @Post('login')
  login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.ekycService.login(username, password);
  }
}
