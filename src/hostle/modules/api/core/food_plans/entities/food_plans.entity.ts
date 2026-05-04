import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('food_plans')
export class FoodPlansEntity {
  @PrimaryGeneratedColumn()
  food_plan_id: number;

  @Column({ type: 'varchar', nullable: true })
  plan_name: string;

  @Column({ type: 'decimal', nullable: true })
  monthly_price: number;

  @Column({ type: 'varchar', nullable: true })
  description: string;
}
