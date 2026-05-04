import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('hostels')
export class HostelsEntity {
  @PrimaryGeneratedColumn()
  hostel_id: number;

  @Column({ type: 'varchar', nullable: true })
  hostel_name: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @Column({ type: 'varchar', nullable: true })
  state: string;

  @Column({ type: 'varchar', nullable: true })
  pincode: string;

  @Column({ type: 'varchar', nullable: true })
  contact_number: string;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
