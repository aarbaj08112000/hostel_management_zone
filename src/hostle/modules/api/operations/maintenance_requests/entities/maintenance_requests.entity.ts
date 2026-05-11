import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';
import { ColumnNumericTransformer } from '@repo/source/utilities/column-numeric.transformer';

@Entity('maintenance_requests')
export class MaintenanceRequestsEntity {
  @PrimaryGeneratedColumn()
  maintenance_id: number;

  @Column()
  hostel_id: number;

  @Column()
  room_id: number;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  reported_by: number;

  @Column({ type: 'varchar', nullable: true })
  issue_description: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  reported_date: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_date: Date;

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
