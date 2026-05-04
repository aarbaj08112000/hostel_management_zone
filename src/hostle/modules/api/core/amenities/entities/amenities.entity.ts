import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}
