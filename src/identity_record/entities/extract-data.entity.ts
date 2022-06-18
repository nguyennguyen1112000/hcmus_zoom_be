import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ExtractData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  referenceName: string;

  @Column({ nullable: true })
  extractName: string;

  @Column({ nullable: true })
  referenceDob: string;

  @Column({ nullable: true })
  extractDob: string;

  @Column({ nullable: true })
  referenceStudentId: string;

  @Column({ nullable: true })
  extractStudentId: string;
}
