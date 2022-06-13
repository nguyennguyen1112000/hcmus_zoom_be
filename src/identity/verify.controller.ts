import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
  Get,
  Response,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { VerifyService } from './verify.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from './helper/generate-file-name';
import { imageFileFilter } from './helper/excel-file-filter';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { ImagesService } from 'src/image/image.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { GetUser } from 'src/users/decorator/user.decorator';
import { userInfo } from 'os';
@ApiTags('identity')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('identity')
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private imagesService: ImagesService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        studentId: {
          type: 'string',
        },
        zoomId: {
          type: 'string',
        },
        passCode: {
          type: 'string',
        },
        linkZoom: {
          type: 'string',
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
      fileFilter: imageFileFilter,
    }),
  )
  async verifyStudent(
    @Body() verifyStudentDto: VerifyStudentDto,
    @UploadedFile() file,
  ) {
    const images = await this.imagesService.getAllByStudentId(
      verifyStudentDto.studentId,
    );
    // const uploadTasks = images.map(
    //   (img) =>
    //     new Promise(async (resolve, reject) => {
    //       const file = await this.imagesService.getFile(img.imageId);
    //       const target = createWriteStream(
    //         `./public/images/${img.imageId}.jpg`,
    //       );
    //       file.pipe(target);
    //       target.on('finish', resolve);
    //     }),
    // );

    // return Promise.all(uploadTasks).then(async () => {
    //   return await this.verifyService.verify(file, verifyStudentDto, images);
    // });
    return await this.verifyService.verify(file, verifyStudentDto, images);
  }

  @Post('id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        recordId: {
          type: 'string',
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
      fileFilter: imageFileFilter,
    }),
  )
  async verifyStudentId(
    @GetUser() user,
    @UploadedFile() file,
    @Body('recordId') recordId: string,
  ) {
    return this.verifyService.verifyId(file, user, recordId);
  }
}
