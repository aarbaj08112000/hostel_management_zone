import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('invoices')
export class InvoicesEntity {
  @PrimaryGeneratedColumn()
  invoice_id: number;

  @Column()
  stay_id: number;

  @Column({ type: 'datetime', nullable: true })
  invoice_month: Date;

  @Column({ type: 'decimal', nullable: true })
  total_amount: number;

  @Column({ type: 'datetime', nullable: true })
  due_date: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
