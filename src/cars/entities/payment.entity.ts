import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

export enum PAYMENTMODE {
  CREDITCARD = 'CreditCard',
  DEBITCARD = 'DebitCard',
  NETBANKING = 'NetBanking',
  UPI = 'UPI',
  CASH = 'Cash',
  OTHER = 'Other',
}

export enum PAYMENTTYPE {
  ADVANCE = 'Advance',
  INSTALLMENT = 'Installment',
  FULLPAYMENT = 'FullPayment',
}

export enum STATUS {
  PENDING = 'Pending',
  AWAITINGCONFIRMATION = 'AwaitingConfirmation',
  PARTIALLYPAID = 'PartiallyPaid',
  FULLYPAID = 'FullyPaid',
  REFUNDED = 'Refunded',
  FAILED = 'Failed',
}

@Entity('payment')
export class Payment extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  transactionCode: string;

  @Column({ type: 'int' })
  bookingId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PAYMENTMODE })
  paymentMode: PAYMENTMODE;

  @Column({ type: 'enum', enum: PAYMENTTYPE })
  paymentType: PAYMENTTYPE;

  @Column({ type: 'enum', enum: STATUS })
  status: STATUS;
}
