import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
export enum STATUS {
  OPEN = 'Open',
  INPROGRESS = 'Inprogress',
  CLOSED = 'Closed'
}
export enum TYPE {
  SELL = 'Sell',
  BUY = 'Buy'
}

@Entity('sell_car')
export class SellCarEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  code: string;
  
  @Column({ type: 'varchar', length: 255 })
  name: string;
  
  @Column({ type: 'varchar', length: 255 })
  dialCode: string;

  @Column({ type: 'varchar', length: 255 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'int' })
  brandId: string;

  @Column({ type: 'int' })
  modelId: string;

  @Column({ type: 'int' })
  variantId: string;

  @Column({ type: 'int' })
  colorId: string;

  @Column({ type: 'int' })
  locationId: string;

  @Column({ type: 'varchar', length: 255 })
  year: string;

  @Column({ type: 'varchar', length: 255 })
  kmReading: string;

  @Column({ type: 'date', nullable: true })
  appointmentDate: Date;

  @Column({ type: 'varchar', nullable: true })
  appointmentTime: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  addedDate: Date;

  @Column({ type: 'json', nullable: true })
  otherDetails: string;

  @Column({
    type: 'enum',
    enum: STATUS,
    default: STATUS.OPEN,
  })
  status: STATUS;

  @Column({
    type: 'enum',
    enum: TYPE,
    default: TYPE.SELL,
  })
  type: TYPE;

  @Column({ type: 'int' , nullable: true })
  regionId: string;

  @Column({type : 'int', nullable :true})
  companyId : string
}

@Entity('sell_car_images')
export class SellCarAttachmentsEntity {
  @PrimaryGeneratedColumn()
  attachmentId: number;

  @Column({ type: 'varchar', length: 255 })
  attachmentName: string;

  @Column({ type: 'int', nullable: true })
  sourceId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileType: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadDate: Date;

  @Column({ type: 'text', nullable: true })
  filePath: string;
}