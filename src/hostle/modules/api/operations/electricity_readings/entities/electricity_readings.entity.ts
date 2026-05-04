import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('electricity_readings')
export class ElectricityReadingsEntity {
  @PrimaryGeneratedColumn()
  reading_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'datetime', nullable: true })
  reading_date: Date;

  @Column({ type: 'decimal', nullable: true })
  units_consumed: number;

  @Column({ type: 'decimal', nullable: true })
  rate_per_unit: number;

  @Column({ type: 'decimal', nullable: true })
  total_amount: number;
}
