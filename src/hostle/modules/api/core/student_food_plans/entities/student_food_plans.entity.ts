import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('student_food_plans')
export class StudentFoodPlansEntity {
  @PrimaryGeneratedColumn()
  student_food_plan_id: number;

  @Column()
  stay_id: number;

  @Column()
  food_plan_id: number;

  @Column({ type: 'datetime', nullable: true })
  start_date: Date;

  @Column({ type: 'datetime', nullable: true })
  end_date: Date;
}
