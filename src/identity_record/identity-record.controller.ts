import {
  Controller,
  Get,
  UseGuards,
  Param,
  Put,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { IdentityRecordService } from './identity-record.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';

@ApiTags('identity-record')
@Controller('identity-record')
export class IdentityRecordController {
  constructor(private readonly recordService: IdentityRecordService) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth('JWT-auth')
  // @Get()
  // findAll() {
  //   return this.recordService.findAll();
  // }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.recordService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.PROCTOR)
  @Get('room/:id')
  getOneByRoom(@GetUser() user: any, @Param('id') id: number) {
    return this.recordService.getAllByRoom(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('room/:roomId/me')
  findMyAllRecords(@GetUser() user, @Param('roomId') roomId: number) {
    return this.recordService.getMyRecordsOfRoom(user, roomId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.PROCTOR)
  @Get()
  getAll(@GetUser() user: any) {
    return this.recordService.getAll(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.PROCTOR)
  @Get('room/:id/:studentId')
  getOneByRoomAndStudent(
    @Param('id') id: number,
    @Param('studentId') studentId: string,
  ) {
    return this.recordService.getAllByRoomAndStudent(id, studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.PROCTOR)
  @Put(':roomId/:studentId')
  updateStatus(
    @Param('roomId') roomId: number,
    @Param('studentId') studentId: string,
    @Body('note') note: string,
    @Body('accepted') accepted: boolean,
  ) {
    return this.recordService.updateStatus(roomId, studentId, accepted, note);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Delete()
  delete(@Body() ids: string[]) {
    return this.recordService.deletes(ids);
  }
}
