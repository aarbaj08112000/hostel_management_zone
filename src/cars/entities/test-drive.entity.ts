import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

enum TYPE {
  ATDOORSTEP = 'AtDoorstep',
  ATSHOWRROM = 'AtShowroom'
}

enum STATUS {
  ACTIVE = 'Active',
  SCHEDULED = 'Scheduled',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  RESCHEDULED = 'Re-Scheduled',
  CANCELLED = 'Cancelled'
}

@Entity('test_drive')
export class TestDriveEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'enum', enum: TYPE })
  type: TYPE;

  @Column({ type: 'int', nullable: true })
  carId: number;

  @Column({ type: 'int', nullable: true })
  locationId: number;

  @Column({ type: 'int', nullable: true })
  customerId: number;

  @Column({ type: 'date', nullable: true })
  slotDate: Date;

  @Column({ type: 'varchar', nullable: true })
  slotTime: string;

  @Column({ type: 'text', nullable: true })
  licenseHolderDetails: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  remarks: string;

  @Column({ type: 'enum', enum: STATUS })
  status: STATUS;

  @Column({ type: 'text' })
  attachment: string;
}
