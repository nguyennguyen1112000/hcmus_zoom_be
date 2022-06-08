/* eslint-disable prefer-const */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { GoogleDriveService } from 'src/image/googleDriveService';
import { ImageData } from './entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentsService } from 'src/student/student.service';
import { ImageType } from './decorator/image-type.enum';
import { Student } from 'src/student/entities/student.entity';
import { CreateStudentDto } from 'src/student/dto/create-student.dto';
@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ImageData)
    private imagesRepository: Repository<ImageData>,
    private studentsService: StudentsService,
  ) {}
  async create(file: any, studentId: string, type: ImageType) {
    try {
      const image = new ImageData();
      const student = await this.studentsService.findOne(studentId);
      image.student = student;
      image.type = type;

      const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
      const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
      const googleDriveService = new GoogleDriveService(
        driveClientId,
        driveClientSecret,
        driveRedirectUri,
        driveRefreshToken,
      );

      const finalPath = file.path;
      const folderName = 'ProctoringApp';

      let folder = await googleDriveService
        .searchFolder(folderName)
        .catch((error) => {
          console.error(error);
          return null;
        });

      if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
      }
      const subFolderName = `Image_${studentId}`;
      let subFolder = await googleDriveService
        .searchFolder(subFolderName)
        .catch((error) => {
          console.error(error);
          return null;
        });
      let subFolderId;
      if (subFolder) subFolderId = subFolder.id;
      else {
        subFolder = await googleDriveService.createSubFolder(
          subFolderName,
          folder.id,
        );
        subFolderId = subFolder.data.id;
      }

      const fileUpload = await googleDriveService
        .saveFile(file.originalname, finalPath, 'image/jpg', subFolderId)
        .catch((error) => {
          console.error(error);
        });
      const fileId = fileUpload.data.id;
      image.imageId = fileId;
      image.fetchUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
      const getUrl = await await googleDriveService.setFilePublic(fileId);
      image.imageUrl = getUrl.data.webViewLink;
      image.downloadUrl = getUrl.data.webContentLink;
      image.originFileName = file.originalname;
      fs.unlinkSync(finalPath);
      const saveImage = await this.imagesRepository.save(image);
      return saveImage;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  async createData(
    file: any,
    studentId: string,
    name: string,
    type: ImageType,
  ) {
    try {
      const image = new ImageData();
      let student = await this.studentsService.findOneWithNoError(studentId);
      if (!student) {
        const email = `${studentId}@student.hcmus.edu.vn}`;
        const nameArr = name.split(' ');
        const lastName = nameArr[nameArr.length - 1];
        nameArr.pop();
        const firstName = nameArr.join(' ');
        const createStudentDto = new CreateStudentDto();
        createStudentDto.studentId = studentId;
        createStudentDto.firstName = firstName;
        createStudentDto.lastName = lastName;
        createStudentDto.email = email;

        student = await this.studentsService.create(createStudentDto);
      }
      image.student = student;
      image.type = type;

      const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
      const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
      const googleDriveService = new GoogleDriveService(
        driveClientId,
        driveClientSecret,
        driveRedirectUri,
        driveRefreshToken,
      );

      const finalPath = file.path;
      const folderName = 'ProctoringApp';

      let folder = await googleDriveService
        .searchFolder(folderName)
        .catch((error) => {
          console.error(error);
          return null;
        });

      if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
      }
      const subFolderName = `Image_${studentId}`;
      let subFolder = await googleDriveService
        .searchFolder(subFolderName)
        .catch((error) => {
          console.error(error);
          return null;
        });
      let subFolderId;
      if (subFolder) subFolderId = subFolder.id;
      else {
        subFolder = await googleDriveService.createSubFolder(
          subFolderName,
          folder.id,
        );
        subFolderId = subFolder.data.id;
      }

      const fileUpload = await googleDriveService
        .saveFile(file.originalname, finalPath, 'image/jpg', subFolderId)
        .catch((error) => {
          console.error(error);
        });
      const fileId = fileUpload.data.id;
      image.imageId = fileId;
      image.fetchUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
      const getUrl = await await googleDriveService.setFilePublic(fileId);
      image.imageUrl = getUrl.data.webViewLink;
      image.downloadUrl = getUrl.data.webContentLink;
      image.originFileName = file.originalname;
      fs.unlinkSync(finalPath);
      const saveImage = await this.imagesRepository.save(image);
      return saveImage;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  async createDataV1(file: any, studentId: string) {
    try {
      const image = new ImageData();
      let student = await this.studentsService.findOne(studentId);
      image.student = student;
      image.type = ImageType.FACE_DATA;

      const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
      const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
      const googleDriveService = new GoogleDriveService(
        driveClientId,
        driveClientSecret,
        driveRedirectUri,
        driveRefreshToken,
      );

      const finalPath = file.path;
      const folderName = 'ProctoringApp';

      let folder = await googleDriveService
        .searchFolder(folderName)
        .catch((error) => {
          console.error(error);
          return null;
        });

      if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
      }
      const subFolderName = `Image_${studentId}`;
      let subFolder = await googleDriveService
        .searchFolder(subFolderName)
        .catch((error) => {
          console.error(error);
          return null;
        });
      let subFolderId;
      if (subFolder) subFolderId = subFolder.id;
      else {
        subFolder = await googleDriveService.createSubFolder(
          subFolderName,
          folder.id,
        );
        subFolderId = subFolder.data.id;
      }

      const fileUpload = await googleDriveService
        .saveFile(file.originalname, finalPath, 'image/jpg', subFolderId)
        .catch((error) => {
          console.error(error);
        });
      const fileId = fileUpload.data.id;
      image.imageId = fileId;
      image.fetchUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
      const getUrl = await await googleDriveService.setFilePublic(fileId);
      image.imageUrl = getUrl.data.webViewLink;
      image.downloadUrl = getUrl.data.webContentLink;
      image.originFileName = file.originalname;
      fs.unlinkSync(finalPath);
      const saveImage = await this.imagesRepository.save(image);
      return saveImage;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
  async getAll(studentId: number) {
    return await this.imagesRepository.find({
      where: { student: { id: studentId } },
    });
  }
  async getMyFaceImage(studentId: string) {
    return await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.student', 'student')
      .where('image.type = :type', { type: ImageType.FACE_DATA })
      .andWhere('student.studentId = :studentId', { studentId: studentId })
      .getMany();
  }
  async deleteImage(id: number) {
    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const googleDriveService = new GoogleDriveService(
      driveClientId,
      driveClientSecret,
      driveRedirectUri,
      driveRefreshToken,
    );
    const image = await this.imagesRepository.findOne(id);
    if (!image)
      throw new BadRequestException(`Image with id = ${id} not found `);
    const deleteFile = await googleDriveService.deleteFile(image.imageId);
    return await this.imagesRepository.remove(image);
  }
  async getAllByStudentIds(studentIds: number[]) {
    return await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.studentId IN (:...ids)', { ids: studentIds })
      .getMany();
  }

  async getAllByStudentId(studentId: string) {
    const student = await this.studentsService.findOne(studentId);
    return await this.imagesRepository.find({
      where: { studentId: student.id, type: ImageType.FACE_DATA },
    });
  }

  async getFile(imageId: string) {
    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const googleDriveService = new GoogleDriveService(
      driveClientId,
      driveClientSecret,
      driveRedirectUri,
      driveRefreshToken,
    );
    return await googleDriveService.getFile(imageId);
  }
  async createIdentiyResultImage(file: any, type: ImageType) {
    try {
      const image = new ImageData();
      image.type = type;

      const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
      const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
      const googleDriveService = new GoogleDriveService(
        driveClientId,
        driveClientSecret,
        driveRedirectUri,
        driveRefreshToken,
      );
      const finalPath = file.path;
      const folderName = 'ProctoringResult';

      let folder = await googleDriveService
        .searchFolder(folderName)
        .catch((error) => {
          console.error(error);
          return null;
        });

      if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
      }
      const fileUpload = await googleDriveService
        .saveFile(file.originalname, finalPath, 'image/jpg', folder.id)
        .catch((error) => {
          console.error(error);
        });
      const fileId = fileUpload.data.id;
      image.imageId = fileId;
      image.fetchUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
      const getUrl = await await googleDriveService.setFilePublic(fileId);
      image.imageUrl = getUrl.data.webViewLink;
      image.downloadUrl = getUrl.data.webContentLink;
      image.originFileName = file.originalname;
      fs.unlinkSync(finalPath);
      const saveImage = await this.imagesRepository.save(image);
      return saveImage;
    } catch (err) {
      console.log(err.message);

      throw new BadRequestException(err.message);
    }
  }
}
