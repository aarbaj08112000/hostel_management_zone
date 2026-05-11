import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsersEntity } from '../../users/entities/users.entity';

@Entity('students')
export class StudentsEntity {
  @PrimaryGeneratedColumn()
  student_id: number;

  @Column({ type: 'varchar', nullable: true })
  first_name: string;

  @Column({ type: 'varchar', nullable: true })
  last_name: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ type: 'varchar', nullable: true })
  id_proof_number: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

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
