import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CredentialDto } from './dto/credential.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentialDto: CredentialDto) {
    const { code } = credentialDto;
    const user = await this.authService.validateZoomUser(code);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Post('login/moodle')
  async loginMoodle(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return await this.authService.loginMoodle(username, password);
  }

  @Post('login/microsoft')
  async loginMicrosoft(@Body('accessToken') accessToken: string) {
    return await this.authService.loginWithMicrosoft(accessToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
