import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';
import { column } from 'mathjs';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

enum TYPE {
  FIXED = 'Fixed',
  PERCENTAGE = 'Percentage',
  VARIABLE = 'Variable',
}

enum CHARGEFOR {
  additional = 'Additional',
  showroom = 'Showroom',
}

@Entity('charges')
export class ChargesEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  chargeName: string;

  @Column({ type: 'enum', enum: TYPE })
  type: string;

  @Column({ type: 'enum', enum: CHARGEFOR })
  chargeFor: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', nullable: true, enum: STATUS })
  status: STATUS;
}
