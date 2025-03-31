import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('car_tags')
export class CarTagsEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carTagId: number;

  @Column({ type: 'int' })
  tagId: number;

  @Column({ type: 'int' })
  carId: number;
}