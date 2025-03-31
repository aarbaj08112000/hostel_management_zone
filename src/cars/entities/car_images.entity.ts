import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
enum ImageType {
  front = 'front',
  rear = 'rear',
  side = 'side',
  interior = 'interior',
  engine = 'engine',
  dashboard = 'dashboard',
}
@Entity('car_images')
export class CarImagesEntity {
  @PrimaryGeneratedColumn()
  carImageId: number;

  @Column({ type: 'int' })
  carId: number;

  @Column({ type: 'varchar', length: 255 })
  imageName: string;

  @Column({ type: 'enum', enum: ImageType })
  imageType: ImageType;
}
