import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBase } from '@repo/source/entities/base-user.entity';

enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('body_type')
export class BodyEntity extends UserBase {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  bodyTypeId: number;

  @Column({ type: 'varchar', length: 255 })
  bodyType: string;

  @Column({ type: 'char', unique: true })
  bodyCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bodyImage: string;

  @Column({ type: 'enum', nullable: true, enum: STATUS })
  status: STATUS;

  //@Column({type : 'int', nullable :true})
  //companyId : string
}
