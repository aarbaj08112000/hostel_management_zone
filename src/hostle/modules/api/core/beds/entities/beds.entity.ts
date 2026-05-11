import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../../users/users/entities/users.entity';

@Entity('beds')
export class BedsEntity {
  @PrimaryGeneratedColumn()
  bed_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'varchar', nullable: true })
  bed_number: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

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
