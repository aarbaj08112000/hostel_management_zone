import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users/services/users.service';
import { StudentsService } from './students/services/students.service';
import { StaysService } from './stays/services/stays.service';
import { UsersEntity } from './users/entities/users.entity';
import { StudentsEntity } from './students/entities/students.entity';
import { StaysEntity } from './stays/entities/stays.entity';
import { GlobalModule } from '@repo/source/modules/global.module';
import { UserAddService } from './users/services/users.add.service';
import { StudentAddService } from './students/services/students.add.service';
import { StaysAddService } from './stays/services/stays.add.service';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import { AttachmentEntity } from './users/entities/users.entity';
import { UsersAuthService } from './users/services/users.auth.service';
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([UsersEntity, StudentsEntity, StaysEntity,AttachmentEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService, StudentsService, StaysService, GlobalModule,UserAddService,StudentAddService,StaysAddService,CommonAttachmentService, UsersAuthService],
})
export class UsersModule {}
