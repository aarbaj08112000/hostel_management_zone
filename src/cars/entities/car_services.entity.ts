import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';
enum YesNo {
  Yes = 'Yes',
  No = 'No',
}
@Entity('car_services') 
export class CarServicesEntity extends UserBase {
  
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carServiceId: number;

  @Column({ type: 'int', unsigned: true })
  carId: number;

  @Column({ type: 'int', unsigned: true })
  serviceId: number;

  @Column({ type: 'decimal', precision: 7, scale: 2 })
  rateValue: number;

  @Column({ type: 'enum', enum: YesNo, default: YesNo.Yes })
  isOptional: YesNo;

  //@Column({type : 'int', nullable :true})
  //companyId : string
}
