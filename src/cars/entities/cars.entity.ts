import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';


enum CarCondition {
  Excellent = 'Excellent',
  Good = 'Good',
  Satisfactory = 'Satisfactory',
}

export enum Status {
  Available = 'Available',
  UnAvailable = 'UnAvailable',
  Booked = 'Booked',
  Sold = 'Sold',
  Draft = 'Draft',
}
enum YesNo {
  Yes = 'Yes',
  No = 'No',
}
enum Export {
  CanBeExported = 'CanBeExported',
  NotForExport = 'NotForExport'
}
@Entity('cars')
export class CarEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carId: number;

  @Column({ type: 'varchar', length: 255 })
  carName: string;

  @Column({ type: 'text', nullable: true })
  carDescription: string;

  @Column({ type: 'double', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: CarCondition })
  carCondition: CarCondition;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  carImage: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'enum', enum: Status, default: Status.Draft })
  status: Status;

  @Column({ type: 'longtext', nullable: true })
  shortDescription: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  contactPersonId: number;

  @Column({ type: 'text', nullable: true })
  overviewTitle: string;

  @Column({ type: 'enum', enum: YesNo, default: YesNo.Yes })
  isListed: YesNo;

  @Column({ type: 'text', nullable: true })
  carCode: string;

  @Column({ type: 'int', unsigned: true })
  locationId: number;

  @Column({ type: 'enum', enum: Export })
  exportStatus: Export;

  @Column({ type: 'enum', enum: ['Yes', 'No'], nullable: true })
  discountEnabled: 'Yes' | 'No';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number;

  @Column({ type: 'int', nullable: true })
  bookingDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bookingAmount: number;

  @Column({ type: 'int', nullable: true })
  reservedDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reservedAmount: number;

  @Column({ type: 'text', nullable: true })
  bookedByDetails: string;

  @Column({ type: 'timestamp', nullable: true })
  bookedDate: Date;

  @Column({type : 'text' , nullable: true})
  analytics : string

  @Column({ type: 'int', nullable: true })
  generatedView : string;

  @Column({ type: 'int', nullable: true })
  generatedWishList : string;
}

enum InsuranceType {
  ThirdParty = 'ThirdParty',
  Comprehensible = 'Comprehensible',
  NotAvailable = 'NotAvailable',
}


enum accidentalHistory {
  no_accidental_history = 'no_accidental_history',
  minor_wear_tear = 'minor_wear_tear',
}

@Entity('car_history')
export class CarHistoryEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carHistoryId: number;

  @Column({ type: 'int', unsigned: true })
  carId: number;

  @Column({ type: 'varchar', length: 255 })
  registrationNumber: string;

  @Column({ type: 'date' })
  registrationDate: Date;

  @Column({ type: 'date' })
  registrationExpiry: Date;

  @Column({ type: 'enum', enum: InsuranceType })
  insuranceType: InsuranceType;

  @Column({ type: 'date', nullable: true })
  insuranceExpiry: Date;

  @Column({ type: 'enum', enum: YesNo })
  accidentHistory: YesNo;

  @Column({ type: 'int', unsigned: true, nullable: true })
  insuranceProvideId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insurancePolicyNumber: string;

  @Column({ type: 'enum', enum: YesNo, nullable: true })
  isColetral: YesNo;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coletralWith: string;

  @Column({ type: 'enum', enum: accidentalHistory })
  accidentalHistory: accidentalHistory;

  @Column({ type: 'enum', enum: YesNo })
  afterMarketModification: YesNo;

  @Column({ type: 'enum', enum: YesNo })
  serviceHistory: YesNo;

  @Column({ type: 'enum', enum: YesNo })
  warranty: YesNo;

  @Column({ type: 'int' })
  ownerNumber: number;
}

@Entity('car_tags')
export class CarTagEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carTagId: number;

  @Column({ type: 'int' })
  tagId: number;

  @Column({ type: 'int' })
  carId: number;
}

@Entity('car_feature')
export class CarFeatureEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  carFeatureId: number;

  @Column({ type: 'int' })
  featureId: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'varchar' })
  featureValue: string;
}

@Entity('car_documents')
export class CarDocumentEntity extends UserBase {
  @PrimaryGeneratedColumn()
  carDocumentId: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'varchar', length: 255 })
  documentTitle: string;

  @Column({ type: 'int' })
  documentTypeId: string;
}

@Entity('car_wishlist')
export class CarWishlistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'int' })
  userId: number;
}
