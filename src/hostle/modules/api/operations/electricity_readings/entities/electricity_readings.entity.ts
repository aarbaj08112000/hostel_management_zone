import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';
import { ColumnNumericTransformer } from '@repo/source/utilities/column-numeric.transformer';

@Entity('electricity_readings')
export class ElectricityReadingsEntity {
  @PrimaryGeneratedColumn()
  reading_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'datetime', nullable: true })
  reading_date: Date;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  units_consumed: number;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  rate_per_unit: number;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  total_amount: number;

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
