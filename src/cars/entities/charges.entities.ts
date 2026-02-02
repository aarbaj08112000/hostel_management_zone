import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('charges')
export class Charges extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  chargesId: number;

  @Column({ type: 'varchar', length: 255 })
  chargeName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  chargeAmount: number;

  @Column({ type: 'enum', enum: ['fixed', 'variable'] })
  chargeType: 'fixed' | 'variable';

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  addedDate: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedDate: Date;

  @Column({type : 'int', nullable :true})
  companyId : string
}
