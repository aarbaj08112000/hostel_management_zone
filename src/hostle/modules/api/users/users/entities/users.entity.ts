import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string;

  @Column({ type: 'varchar', nullable: true })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'decimal', nullable: true })
  added_by: number;

  @Column({ type: 'decimal', nullable: true })
  updated_by: number;

  @Column({ type: 'datetime', nullable: true })
  added_date: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_date: Date;
}

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn()
  attachment_id: number;

  @Column({ type: 'varchar', length: 255 })
  module: string; // e.g., 'user', 'student', 'room', etc.

  @Column({ type: 'int' })
  reference_id: number; // ID of the record (user_id, student_id, etc.)

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 255 })
  file_path: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  file_type: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'timestamp' })
  created_date: Date;

  @Column({ type: 'timestamp' })
  updated_date: Date;
}
