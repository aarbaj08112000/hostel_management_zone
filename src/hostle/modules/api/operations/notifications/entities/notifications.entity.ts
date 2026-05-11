import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';

@Entity('notifications')
export class NotificationsEntity {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  notification_type: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'datetime', nullable: true })
  sent_date: Date;

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
