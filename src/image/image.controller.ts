import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
//import { createReadStream } from 'fs';
//import { join } from 'path';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ImagesService } from './image.service';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { imageFileFilter } from 'src/identity/helper/excel-file-filter';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImageType } from './decorator/image-type.enum';
import { GetUser } from 'src/users/decorator/user.decorator';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImagesService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
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
        studentId: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/images',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadImages(
    @Body('studentId') studentId: string,
    @Body('type') type: ImageType,
    @UploadedFile() file,
  ) {
    return await this.imageService.create(file, studentId, type);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  async getMyImages(@GetUser() user) {
    return this.imageService.getMyFaceImage(user.studentId);
  }
  @Get(':studentId')
  async getImages(@Param('studentId') studentId: number) {
    return this.imageService.getAll(studentId);
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: number) {
    return this.imageService.deleteImage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('collect/data/v1')
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
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/images',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async collectImageV1(
    @Body('studentId') studentId: string,
    @UploadedFile() file,
  ) {
    return await this.imageService.createDataV1(file, studentId);
  }

  @Post('collect/data')
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
        type: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/images',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async collectImage(
    @Body('studentId') studentId: string,
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('type') type: ImageType,
    @UploadedFile() file,
  ) {
    return await this.imageService.createData(file, studentId, name, type);
  }
}
