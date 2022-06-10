import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  ekycUsername: string;

  @Column({ nullable: true })
  ekycPassword: string;

  @Column({ nullable: true })
  ekycToken: string;

  @Column({ nullable: true, default: true })
  openCollectData: boolean;

  @Column({ type: 'float', nullable: true, default: 0.6 })
  credibility: number;

  @Column({ nullable: true, default: 3 })
  maxFailAttempt: number;

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
}
