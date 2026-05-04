import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('maintenance_requests')
export class MaintenanceRequestsEntity {
  @PrimaryGeneratedColumn()
  maintenance_id: number;

  @Column()
  hostel_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'decimal', nullable: true })
  reported_by: number;

  @Column({ type: 'varchar', nullable: true })
  issue_description: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  reported_date: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_date: Date;
}
