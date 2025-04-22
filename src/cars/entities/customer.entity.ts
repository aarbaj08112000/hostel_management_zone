import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

enum IS_MOBILE_VERIFIED {
  YES = 'Yes',
  NO = 'No',
}
enum IS_EMAIL_VERIFIED {
  YES = 'Yes',
  NO = 'No',
}
enum GENDER {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}
export enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('mod_customer')
export class CustomerEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  middleName: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  lastName: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  email: string;

  @Column({ type: 'enum', nullable: true, enum: GENDER })
  gender: GENDER;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  dialCode: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  altDialCode: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  altPhoneNumber: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  preferredContactMethod: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  profileImage: string;

  @Column({ type: 'set', nullable: true })
  authType: string[];

  @Column({ type: 'varchar', nullable: true, length: 255 })
  authCode: string;

  @Column({
    type: 'enum',
    nullable: true,
    enum: IS_MOBILE_VERIFIED,
    default: IS_MOBILE_VERIFIED.NO,
  })
  isMobileVerified: IS_MOBILE_VERIFIED;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  uniqueToken: string;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  otpCode: string;

  @Column({
    type: 'enum',
    nullable: true,
    enum: IS_EMAIL_VERIFIED,
    default: IS_EMAIL_VERIFIED.NO,
  })
  isEmailVerified: IS_EMAIL_VERIFIED;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  verificationCode: string;

  @Column({ type: 'double', nullable: true })
  latitude: number;

  @Column({ type: 'double', nullable: true })
  langitude: number;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  appVersion: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  deviceName: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  deviceOs: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  deviceType: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  deviceToken: string;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({
    type: 'enum',
    nullable: true,
    enum: STATUS,
    default: STATUS.ACTIVE,
  })
  status: STATUS;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  emiratesId: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  emiratesDoc: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  licenseId: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  licenseDoc: string;
}
