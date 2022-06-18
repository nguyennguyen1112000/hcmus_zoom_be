import { ImageData } from 'src/image/entities/image.entity';

export class CreateIdentityRecordDto {
  roomId: number;
  studentId: string;
  faceStatus: boolean;
  //zoomEmail: string;
  faceImage?: ImageData;
  cardImage?: ImageData;
  credibility?: number;
  failTimes?: number;
}
