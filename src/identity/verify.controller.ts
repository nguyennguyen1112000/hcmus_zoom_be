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
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
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
import { RoomsService } from 'src/rooms/room.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';
import { IdentityRecordService } from 'src/identity_record/identity-record.service';
@ApiTags('identity')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('identity')
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private imagesService: ImagesService,
    private roomService: RoomsService,
    private recordService: IdentityRecordService,
  ) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.STUDENT)
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
    @GetUser() user: any,
    @Body() verifyStudentDto: VerifyStudentDto,
    @UploadedFile() file,
  ) {
    const check = await this.roomService.canVerify(
      user,
      verifyStudentDto.roomId,
    );
    const { verifySuccess, timeToVerify, failExceed } = check;
    if (verifySuccess || !timeToVerify || failExceed) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return { errorMessage: check, canVerify: false };
    }
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
    if (images.length == 0)
      throw new BadRequestException(
        'There is no reference data. Please contact your proctor!',
      );
    return {
      record: await this.verifyService.verify(file, verifyStudentDto, images),
      canVerify: true,
    };
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
    @Body('type') type: number,
  ) {
    const record = await this.recordService.findOne(recordId);

    const check = await this.roomService.canVerify(user, record.room.id);

    const { verifySuccess, timeToVerify, failExceed } = check;
    if (verifySuccess || !timeToVerify || failExceed) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return { errorMessages: check };
    }
    return this.verifyService.verifyId(file, user, recordId, type);
  }
}
