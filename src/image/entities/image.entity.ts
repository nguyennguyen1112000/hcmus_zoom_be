import { Student } from 'src/student/entities/student.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ImageType } from '../decorator/image-type.enum';

@Entity()
export class ImageData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ImageType, default: ImageType.STUDENT_CARD })
  type: ImageType;

  @Column()
  imageUrl: string;

  @Column()
  downloadUrl: string;

  @Column()
  fetchUrl: string;

  @Column()
  imageId: string;

  @Column()
  originFileName: string;

  @Column({ nullable: true })
  studentId?: number;

  @ManyToOne((type) => Student, (student) => student.images)
  student: Student;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;
}
