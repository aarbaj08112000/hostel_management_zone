import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rooms')
export class RoomsEntity {
  @PrimaryGeneratedColumn()
  room_id: number;

  @Column()
  hostel_id: number;

  @Column()
  floor_id: number;

  @Column({ type: 'varchar', nullable: true })
  room_number: string;

  @Column({ type: 'varchar', nullable: true })
  room_type: string;

  @Column({ type: 'decimal', nullable: true })
  total_beds: number;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
