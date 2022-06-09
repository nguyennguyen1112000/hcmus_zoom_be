import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Deauthorization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: string;

  @Column()
  userId: string;

  @Column()
  signature: string;

  @Column()
  clientId: string;

  @Column({ type: 'timestamp' })
  deauthorizationTime: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;
}
