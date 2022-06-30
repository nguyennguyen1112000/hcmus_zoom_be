import { ImageData } from 'src/image/entities/image.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  classCode: string;

  @Column({ nullable: true })
  birthday: Date;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  gender: boolean;

  @Column({ nullable: true })
  educationLevel: string;

  @OneToMany((type) => ImageData, (image) => image.student)
  images: ImageData[];

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public updated_at: Date;

  @Column({ nullable: true })
  moodleUsername: string;

  @Column({ nullable: true })
  moodlePassword: string;

  @Column({ nullable: true })
  moodleId: number;
}

        
    
