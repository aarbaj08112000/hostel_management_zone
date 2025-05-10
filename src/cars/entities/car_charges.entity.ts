import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

export enum CHARGE_TYPE {
  FIXED = 'Fixed',
  VARIABLE = 'Variable',
  PERCENTAGE = 'Percentage',
}

@Entity('car_charges')
export class CarChargesEntity extends UserBase {
  
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carChargesId: number;

  @Column({ type: 'int', unsigned: true })
  carId: number;

  @Column({ type: 'int', unsigned: true })
  chargeId: number;

  @Column({ type: 'decimal', precision: 7, scale: 2 }) 
  rateValue: number;
}
