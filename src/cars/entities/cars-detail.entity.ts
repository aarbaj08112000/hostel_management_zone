import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';
enum BodyType {
  Sedan = 'Sedan',
  Suv = 'Suv',
  Convertible = 'Convertible',
  Coupe = 'Coupe',
  Wagon = 'Wagon',
}

enum FuelType {
  Petrol = 'Petrol',
  Diesel = 'Diesel',
  Hybrid = 'Hybrid',
  Electric = 'Electric',
}

enum TransmissionType {
  Manual = 'Manual',
  Automatic = 'Automatic',
}

enum CarCategory {
  ICE = 'ICE',
  EV = 'EV',
  HEV = 'HEV',
  PHEV = 'PHEV',
}

enum SteeringSide {
  LeftHand = 'LeftHand',
  RightHand = 'RightHand',
}

enum YesNo {
  Yes = 'Yes',
  No = 'No',
}

enum Negotiable {
  Yes = 'Yes',
  No = 'No',
}

enum NegotiableRange {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

@Entity('cars_details')
export class CarDetailsEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int' })
  carsDetailsId: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'varchar', length: 255 })
  vinNumber: string;

  @Column({ type: 'varchar', length: 255 })
  chassisNumber: string;

  @Column({ type: 'int' })
  brandId: number;

  @Column({ type: 'int' })
  modelId: number;

  @Column({ type: 'int' })
  bodyTypeid: number;

  @Column({ type: 'enum', enum: FuelType })
  fuelType: FuelType;

  @Column({ type: 'year' })
  manufactureYear: number;

  @Column({ type: 'int' })
  manufactureMonth: number;

  @Column({ type: 'varchar', length: 255 })
  serialNumber: string;

  @Column({ type: 'int' })
  countryId: number;

  @Column({ type: 'enum', enum: TransmissionType })
  transmissionType: TransmissionType;

  @Column({ type: 'enum', enum: CarCategory })
  carCategory: CarCategory;

  @Column({ type: 'double' })
  engineCapacity: number;

  @Column({ type: 'varchar', length: 255 })
  engineType: string;

  @Column({ type: 'varchar', length: 255 })
  engineSize: string;

  @Column({ type: 'int' })
  horsePower: number;

  @Column({ type: 'int' })
  exteriorColorId: number;

  @Column({ type: 'int' })
  interiorColorId: number;

  @Column({ type: 'enum', enum: SteeringSide })
  steeringSide: SteeringSide;

  @Column({ type: 'int' })
  regionalSpecsId: number;

  @Column({ type: 'double' })
  drivenDistance: number;

  @Column({ type: 'int' })
  seatingCapacity: number;

  @Column({ type: 'int' })
  numberOfDoors: number;

  @Column({ type: 'int' })
  variantId: number;

  @Column({ type: 'double', precision: 15, scale: 2, nullable: true })
  monthlyEMIAmount: number;

  @Column({ type: 'enum', enum: Negotiable })
  negotiable: Negotiable;

  @Column({ type: 'enum', enum: NegotiableRange })
  negotiableRange: NegotiableRange;
}
/* */
