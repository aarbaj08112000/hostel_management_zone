import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('beds')
export class BedsEntity {
  @PrimaryGeneratedColumn()
  bed_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'varchar', nullable: true })
  bed_number: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
