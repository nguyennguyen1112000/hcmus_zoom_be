import { ZoomRoom } from 'src/rooms/entities/room.entity';
import { Student } from 'src/student/entities/student.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: false, nullable: true })
  subjectCode: string;

  @Column({ nullable: true })
  term: string;

  @Column({ nullable: true })
  schoolYear: string;

  @Column({ nullable: true })
  teacher: string;

  @Column({ nullable: true })
  classCode: string;

  @Column({ nullable: true })
  studentYear: string;

  @Column({ nullable: true })
  educationLevel: string;

  @Column({ nullable: true })
  examCode: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  moodleId: number;

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

  @OneToMany((type) => ZoomRoom, (room) => room.subject)
  rooms: ZoomRoom[];

  @ManyToMany(() => Student)
  @JoinTable()
  students: Student[];

  // @OneToMany(
  //   (type) => PointStructure,
  //   (pointStructure) => pointStructure.classroom,
  // )
  // pointStructures: PointStructure[];
}
