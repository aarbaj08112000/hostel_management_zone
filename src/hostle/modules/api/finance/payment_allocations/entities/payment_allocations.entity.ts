import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';
import { ColumnNumericTransformer } from '@repo/source/utilities/column-numeric.transformer';

@Entity('payment_allocations')
export class PaymentAllocationsEntity {
  @PrimaryGeneratedColumn()
  allocation_id: number;

  @Column()
  payment_id: number;

  @Column()
  invoice_id: number;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  amount_allocated: number;

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
