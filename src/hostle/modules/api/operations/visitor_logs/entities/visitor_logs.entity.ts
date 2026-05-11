import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';

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

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'added_by' })
  added_by: UsersEntity;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UsersEntity;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
