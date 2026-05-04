import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('hostel_amenities')
export class HostelAmenitiesEntity {
  @PrimaryGeneratedColumn()
  hostel_amenity_id: number;

  @Column()
  hostel_id: number;

  @Column()
  amenity_id: number;
}
