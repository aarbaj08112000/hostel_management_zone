import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('car_model')
export class ModelEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carModelId: number;

  @Column({ type: 'varchar', length: 255 })
  modelName: string;

  @Column({ type: 'char', unique: true })
  modelCode: string;

  @Column({ type: 'char', nullable: true })
  parentModelId: string;

  @Column({ type: 'enum', enum: STATUS })
  status: STATUS;

  @Column({ type: 'int', unsigned: true })
  brandId: number;
  
  @Column({type : 'int', nullable :true})
  companyId : string
}
