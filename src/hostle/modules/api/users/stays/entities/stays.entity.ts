import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('stays')
export class StaysEntity {
  @PrimaryGeneratedColumn()
  stay_id: number;

  @Column()
  student_id: number;

  @Column()
  bed_id: number;

  @Column({ type: 'datetime', nullable: true })
  check_in_date: Date;

  @Column({ type: 'datetime', nullable: true })
  check_out_date: Date;

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
