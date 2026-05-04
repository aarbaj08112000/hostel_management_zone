import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('deposits')
export class DepositsEntity {
  @PrimaryGeneratedColumn()
  deposit_id: number;

  @Column()
  stay_id: number;

  @Column({ type: 'decimal', nullable: true })
  deposit_amount: number;

  @Column({ type: 'datetime', nullable: true })
  deposit_paid_date: Date;

  @Column({ type: 'decimal', nullable: true })
  refund_amount: number;

  @Column({ type: 'datetime', nullable: true })
  refund_date: Date;

  @Column({ type: 'varchar', nullable: true })
  status: string;
}
