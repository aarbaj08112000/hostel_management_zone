import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('variant_master')
export class VariantMasterEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  variantId: number;

  @Column({ type: 'varchar', length: 255 })
  variantName: string;

  @Column({ type: 'char', unique: true })
  variantCode: string;

  @Column({ type: 'enum', nullable: true, enum: STATUS })
  status: STATUS;

  @Column({ type: 'int', unsigned: true })
  modedId: number;
}


