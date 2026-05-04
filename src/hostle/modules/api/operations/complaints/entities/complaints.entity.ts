import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('complaints')
export class ComplaintsEntity {
  @PrimaryGeneratedColumn()
  complaint_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  created_date: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_date: Date;

  @Column({ type: 'varchar', nullable: true })
  complaint_code: string;
}
