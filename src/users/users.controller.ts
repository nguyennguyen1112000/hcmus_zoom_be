import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
  Response,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { excelFileFilter } from 'src/helpers/excel-file-filter';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { UserRole } from './decorator/user.enum';
import { CreateProctorDto } from './dto/create-proctor.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProctorDto } from './dto/update-proctor.dto';
import { UsersService } from './users.service';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  //@UseGuards(JwtAuthGuard)
  //@ApiBearerAuth('JWT-auth')
  //@Roles(UserRole.ADMIN)
  @Get('template/proctor')
  getProctorTemplate(@Response({ passthrough: true }) res): StreamableFile {
    const url = '/public/files/template5.xlsx';
    const fileName = 'proctor_template.xlsx';
    const file = createReadStream(join(process.cwd(), url));

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post('/proctors')
  addProctors(@Body() emails: string[]) {
    return this.usersService.createProctors(emails);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Put('/proctor/:id')
  updateProctor(
    @Param() id: number,
    @Body() updateProctorDto: UpdateProctorDto,
  ) {
    return this.usersService.updateProctor(id, updateProctorDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post('/proctor')
  addStudents(@Body() createProctorDto: CreateProctorDto) {
    return this.usersService.addProctor(createProctorDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  //@Roles(UserRole.ADMIN)
  @Get('')
  getAll(@Query('type') type?: UserRole) {
    return this.usersService.getAll(type);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('')
  deleteStudents(@Body() ids: number[]) {
    return this.usersService.deleteProctors(ids);
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
  async uploadStudentsFile(@UploadedFile() file) {
    return await this.usersService.uploadFile(file);
  }
}
