import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

export enum BOOKINGSTATUS {
  DRAFT = 'Draft',
  BOOKED = 'Booked',
  INPROGRESS = 'Inprogress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
}

export enum PAYMENTSTATUS {
  NA = 'N/A',
  UNPAID = 'Unpaid',
  AWAITINGCONFIRMATION = 'AwaitingConfirmation',
  PARTIALLYPAID = 'PartiallyPaid',
  FULLYPAID = 'FullyPaid',
  REFUNDINITIATED = 'RefundInitiated',
}

export enum SOURCE {
  ADMIN = 'Admin',
  FRONT = 'Front',
}

@Entity('bookings')
export class Booking extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'int' })
  customerId: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'int' })
  locationId: number;

  @Column({ type: 'enum', enum: SOURCE })
  source: SOURCE;

  @Column({ type: 'enum', enum: PAYMENTSTATUS })
  paymentStatus: PAYMENTSTATUS;

  @Column({ type: 'enum', enum: BOOKINGSTATUS })
  status: BOOKINGSTATUS;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountPaid: number;
}

@Entity('booking_service')
export class BookingService {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  bookingServiceId: number;

  @Column({ type: 'int' })
  serviceId: number;

  @Column({ type: 'int' })
  bookingId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  addedDate: Date;
}

@Entity('booking_charges')
export class BookingCharges {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  bookingChargesId: number;

  @Column({ type: 'int' })
  bookingId: number;

  @Column({ type: 'int' })
  chargesId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  addedDate: Date;
}
