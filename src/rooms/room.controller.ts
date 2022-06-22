import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  Response,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { RoomsService } from './room.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { excelFileFilter } from 'src/helpers/excel-file-filter';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @Get('template')
  getStudentsTemplateFile(
    @Response({ passthrough: true }) res,
  ): StreamableFile {
    const url = '/public/files/template3.xlsx';
    const fileName = 'room_template.xlsx';
    const file = createReadStream(join(process.cwd(), url));

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  getMyRoom(@GetUser() user: any) {
    return this.roomsService.getMyRooms(user.studentId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll(@GetUser() user: any) {
    return this.roomsService.findAll(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/files',
        filename: editFileName,
      }),
      fileFilter: excelFileFilter,
    }),
  )
  async uploadRoomFile(@UploadedFile() file) {
    return await this.roomsService.uploadFile(file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete()
  delete(@Body() ids: number[]) {
    return this.roomsService.deletes(ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('import/zoom')
  @Roles(UserRole.ADMIN)
  async importZoomRooms(@GetUser() user: any) {
    const { zoom_access_token } = user;
    const rooms = await this.roomsService.importZoomRoom(zoom_access_token);
    return await this.roomsService.createManyFromZoom(rooms);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  update(@Param() id: number, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Put(':id/subject')
  updateSubject(@Param() id: number, @Body('subjectId') subjectId: number) {
    return this.roomsService.updateSubject(id, subjectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/proctor')
  addProctor(@Param() id: number, @Body('staffCode') staffCode: string) {
    return this.roomsService.addProctor(id, staffCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/students')
  addStudents(@Param() id: number, @Body('studentIds') studentIds: number[]) {
    return this.roomsService.addStudentsToRoom(id, studentIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/proctor/:staffCode')
  deleteProctor(
    @Param('id') id: number,
    @Param('staffCode') staffCode: string,
  ) {
    return this.roomsService.deleteProctor(id, staffCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/students')
  deleteStudents(@Param() id: number, @Body() ids: number[]) {
    return this.roomsService.deleteStudents(id, ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id/canVerify')
  canverify(@GetUser() user, @Param('id') id: number) {
    return this.roomsService.canVerify(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Put(':id/:status')
  updateCheckInTime(@Param('id') id: number, @Param('status') status: string) {
    return this.roomsService.updateCheckInTime(id, status);
  }
}
