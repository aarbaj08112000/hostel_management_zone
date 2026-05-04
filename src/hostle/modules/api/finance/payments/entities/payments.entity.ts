import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('payments')
export class PaymentsEntity {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'decimal', nullable: true })
  amount_paid: number;

  @Column({ type: 'varchar', nullable: true })
  payment_method: string;

  @Column({ type: 'datetime', nullable: true })
  payment_date: Date;

  @Column({ type: 'varchar', nullable: true })
  reference_number: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'decimal', nullable: true })
  invoice_id: number;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
