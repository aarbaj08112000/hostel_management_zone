import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('brand')
export class BrandEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  brandId: number;

  @Column({ type: 'varchar', length: 255 })
  brandName: string;

  @Column({ type: 'char', unique: true })
  brandCode: string;

  @Column({ type: 'enum', nullable: true, enum: STATUS })
  status: STATUS;

  @Column({ type: 'varchar', length: 255 })
  brandImage: string;

}
