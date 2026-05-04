import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('visitor_logs')
export class VisitorLogsEntity {
  @PrimaryGeneratedColumn()
  visitor_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'varchar', nullable: true })
  visitor_name: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string;

  @Column({ type: 'datetime', nullable: true })
  visit_date: Date;

  @Column({ type: 'varchar', nullable: true })
  check_in_time: string;

  @Column({ type: 'varchar', nullable: true })
  check_out_time: string;
}
