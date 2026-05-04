import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('payment_allocations')
export class PaymentAllocationsEntity {
  @PrimaryGeneratedColumn()
  allocation_id: number;

  @Column()
  payment_id: number;

  @Column()
  invoice_id: number;

  @Column({ type: 'decimal', nullable: true })
  amount_allocated: number;
}
