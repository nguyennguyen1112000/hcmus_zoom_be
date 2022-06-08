import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Response,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { SubjectsService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { excelFileFilter } from 'src/helpers/excel-file-filter';
@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}
  @Get('template')
  getSubjectTemplateFile(@Response({ passthrough: true }) res): StreamableFile {
    const url = '/public/files/template2.xlsx';
    const fileName = 'subject_template.xlsx';
    const file = createReadStream(join(process.cwd(), url));

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }

  @Get('template/add_students')
  getAddStudentsTemplateFile(
    @Response({ passthrough: true }) res,
  ): StreamableFile {
    const url = '/public/files/template4.xlsx';
    const fileName = 'add_students_subject_template.xlsx';
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
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.subjectsService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  update(@Param('id') id: number, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete()
  delete(@Body() ids: number[]) {
    return this.subjectsService.deletes(ids);
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
  async uploadFile(@UploadedFile() file) {
    return await this.subjectsService.uploadFile(file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('upload/:id/students')
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
  async uploadStudentsFile(@Param() id: number, @UploadedFile() file) {
    return await this.subjectsService.uploadStudentsFile(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/students')
  deleteStudents(@Param() id: number, @Body() ids: number[]) {
    return this.subjectsService.deleteStudents(id, ids);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/students')
  addStudents(@Param() id: number, @Body() ids: string[]) {
    return this.subjectsService.addStudents(id, ids);
  }
}
