import { IdentityRecord } from 'src/identity_record/entities/indentity-record.entity';
import { Student } from 'src/student/entities/student.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { CheckInCofigType } from '../decorator/config-type.enum';

@Entity()
export class ZoomRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  zoomId: string;

  @Column()
  passcode: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  roomCode: string;

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

  @ManyToOne((type) => Subject, (subjects) => subjects.rooms)
  subject: Subject;

  @OneToMany((type) => IdentityRecord, (record) => record.room)
  identityRecords: IdentityRecord[];

  @ManyToMany(() => Student)
  @JoinTable()
  students: Student[];

  @ManyToMany(() => User)
  @JoinTable()
  proctors: User[];

  @Column({ nullable: true })
  checkInStartTime: Date;

  @Column({ nullable: true })
  checkInEndTime: Date;

  @Column({
    type: 'enum',
    enum: CheckInCofigType,
    default: CheckInCofigType.MANUAL,
  })
  checkInConfigType: CheckInCofigType;
  // @ManyToMany(() => Student)
  // @JoinTable()
  // categories: Category[];

  // @OneToMany((type) => User, (examinationStaff) => examinationStaff.rooms)
  // notifications: Notification[];

  // @OneToMany(
  //   (type) => PointStructure,
  //   (pointStructure) => pointStructure.classroom,
  // )
  // pointStructures: PointStructure[];
}
