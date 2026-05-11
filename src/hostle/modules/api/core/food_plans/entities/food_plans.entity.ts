import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';
import { ColumnNumericTransformer } from '@repo/source/utilities/column-numeric.transformer';

@Entity('food_plans')
export class FoodPlansEntity {
  @PrimaryGeneratedColumn()
  food_plan_id: number;

  @Column({ type: 'varchar', nullable: true })
  plan_name: string;

  @Column({
    type: 'decimal',
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  monthly_price: number;

  @Column({ type: 'varchar', nullable: true })
  description: string;

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
