import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  StreamableFile,
  Response,
  UseInterceptors,
  UploadedFile,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { StudentsService } from './student.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { excelFileFilter } from 'src/helpers/excel-file-filter';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';
import { GetUser } from 'src/users/decorator/user.decorator';
@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Delete()
  delete(@Body() ids: number[]) {
    return this.studentsService.deletes(ids);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }
  @Get('template')
  getStudentsTemplateFile(
    @Response({ passthrough: true }) res,
  ): StreamableFile {
    const url = '/public/files/template1.xlsx';
    const fileName = 'student_template.xlsx';
    const file = createReadStream(join(process.cwd(), url));

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }
  @Get(':studentId')
  findOne(@Param('studentId') studentId: string) {
    return this.studentsService.findOne(studentId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param() id: number, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('upload')
  @Roles(UserRole.ADMIN)
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
    return await this.studentsService.uploadFile(file);
  }
}
