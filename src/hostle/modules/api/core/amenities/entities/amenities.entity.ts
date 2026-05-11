import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';

@Entity('amenities')
export class AmenitiesEntity {
  @PrimaryGeneratedColumn()
  amenity_id: number;

  @Column({ type: 'varchar', nullable: true })
  amenity_name: string;

  @Column({ type: 'varchar', nullable: true })
  amenity_code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'added_by' })
  added_by: UsersEntity;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UsersEntity;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
