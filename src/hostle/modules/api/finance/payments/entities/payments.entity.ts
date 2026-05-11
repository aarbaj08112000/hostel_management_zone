import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';
import { ColumnNumericTransformer } from '@repo/source/utilities/column-numeric.transformer';

@Entity('payments')
export class PaymentsEntity {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column()
  student_id: number;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  amount_paid: number;

  @Column({ type: 'varchar', nullable: true })
  payment_method: string;

  @Column({ type: 'datetime', nullable: true })
  payment_date: Date;

  @Column({ type: 'varchar', nullable: true })
  reference_number: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  invoice_id: number;

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
