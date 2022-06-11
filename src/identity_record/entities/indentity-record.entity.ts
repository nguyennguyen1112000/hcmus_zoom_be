import { ImageData } from 'src/image/entities/image.entity';
import { ZoomRoom } from 'src/rooms/entities/room.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class IdentityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  // @Column()
  // zoomEmail: string;

  @Column({ nullable: true })
  faceStatus: boolean;

  @Column({ type: 'float', nullable: true })
  credibility: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  idStatus: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @ManyToOne((type) => ZoomRoom, (room) => room.identityRecords, {
    onDelete: 'CASCADE',
  })
  room: ZoomRoom;

  @Column({ nullable: true })
  roomId?: number;

  @Column('text', { nullable: true })
  note: string;

  @Column({ nullable: true })
  accepted: boolean;

  @OneToOne(() => ImageData)
  @JoinColumn()
  faceImage: ImageData;

  @OneToOne(() => ImageData)
  @JoinColumn()
  cardImage: ImageData;
}
