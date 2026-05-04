import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreController } from './core.controller';
import { HostelsService } from './hostels/services/hostels.service';
import { StudentFoodPlansAddService } from './student_food_plans/services/student_food_plans.add.service';
import { HostelsEntity } from './hostels/entities/hostels.entity';
import { FloorsEntity } from './floors/entities/floors.entity';
import { RoomsEntity } from './rooms/entities/rooms.entity';
import { BedsEntity } from './beds/entities/beds.entity';
import { AmenitiesEntity } from './amenities/entities/amenities.entity';
import { HostelAmenitiesEntity } from './hostel_amenities/entities/hostel_amenities.entity';
import { FoodPlansEntity } from './food_plans/entities/food_plans.entity';
import { StudentFoodPlansEntity } from './student_food_plans/entities/student_food_plans.entity';
import { HostelAddService } from './hostels/services/hostels.add.service';
import { FloorsService } from './floors/services/floors.service';
import { FloorsAddService } from './floors/services/floors.add.service';
import { RoomsService } from './rooms/services/rooms.service';
import { RoomAddService } from './rooms/services/rooms.add.services';
import { BedsService } from './beds/services/beds.service';
import { BedsAddService } from './beds/services/beds.add.service';
import { AmenitiesService } from './amenities/services/amenities.service';
import { AmenitiesAddService } from './amenities/services/amenties.add.service';
import { HostelAmenitiesService } from './hostel_amenities/services/hostel_amenities.service';
import { HostelAmenitiesAddService } from './hostel_amenities/services/hostle_amenities.add.service';
import { FoodPlansService } from './food_plans/services/food_plans.service';
import { FoodPlansAddService } from './food_plans/services/food_plan.add.service';
import { StudentFoodPlansService } from './student_food_plans/services/student_food_plans.service';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import { AttachmentEntity } from '../users/users/entities/users.entity';
import { GlobalModule } from '@repo/source/modules/global.module';
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([
      HostelsEntity,
      FloorsEntity,
      RoomsEntity,
      BedsEntity,
      AmenitiesEntity,
      HostelAmenitiesEntity,
      FoodPlansEntity,
      StudentFoodPlansEntity,
      AttachmentEntity,
    ]),
  ],
  controllers: [CoreController],
  providers: [
    GlobalModule,
    HostelsService,
    FloorsService,
    RoomsService,
    BedsService,
    AmenitiesService,
    HostelAmenitiesService,
    FoodPlansService,
    StudentFoodPlansService,
    StudentFoodPlansAddService,
    CommonAttachmentService,
    HostelAddService,
    FloorsAddService,
    RoomAddService,
    BedsAddService,
    AmenitiesAddService,
    HostelAmenitiesAddService,
    FoodPlansAddService,
  ],
})
export class CoreModule {}
