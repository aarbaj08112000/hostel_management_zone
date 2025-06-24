import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
export enum ENTITY {
    SELLCAR = 'sell_car'
}

@Entity('comments')
export class CommentEntity {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({
        type: 'enum',
        enum: ENTITY,
        nullable: true,
    })
    entityType: ENTITY;

    @Column({ type: 'int' })
    entityId: string;

    @Column({ type: 'int' })
    addedBy: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    addedDate: Date;
}

@Entity('attachments')
export class AttachmentsEntity {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    fileName: string;

    @Column({ type: 'int' })
    commentId: string;

    @Column({ type: 'int' })
    addedBy: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    addedDate: Date;
}