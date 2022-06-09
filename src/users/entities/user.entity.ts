import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserStatus } from '../decorator/user-status.enum';
import { UserRole } from '../decorator/user.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  googleId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  birthday: Date;

  @Column({ default: true })
  gender: boolean;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  staffCode: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  zoomId: string;

  @Column({ nullable: true })
  moodleId: string;

  @Column({ nullable: true })
  moodleUsername: string;

  @Column({ nullable: true })
  moodlePassword: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;
}
