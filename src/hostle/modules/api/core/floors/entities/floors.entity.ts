import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('floors')
export class FloorsEntity {
  @PrimaryGeneratedColumn()
  floor_id: number;

  @Column()
  hostel_id: number;

  @Column({ type: 'decimal', nullable: true })
  floor_number: number;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
