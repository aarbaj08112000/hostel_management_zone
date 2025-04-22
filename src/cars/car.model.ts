import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarFeatureAddService } from './service/car_feature_add.service';
import { CarTagAddService } from './service/car_tag_add.service';
import { CarTagsAddService } from './service/car_tags_add.service';
import { BodyEntity } from './entities/body.entity';
import { BrandEntity } from './entities/brand.entity';
import { CarFeatureEntity } from './entities/cars.entity';
import { CarTagsEntity } from './entities/car-tag.entity';
import { ModelEntity } from './entities/model.entity';
import { ModelAddService } from './service/model_add.service';
import { BodyAddService } from './service/body_add.service';
import { CarModelDetailsService } from './service/car_model_details.service';
import { BodyTypeDetailsService } from './service/body_type_details.service';
import { CarEntity, CarHistoryEntity, CarTagEntity, CarDocumentEntity, CarWishlistEntity } from './entities/cars.entity';
import { CarDetailsEntity } from './entities/cars-detail.entity';
import { CarImagesEntity } from './entities/car_images.entity';
import { SyncElasticEntity } from '@repo/source/entities/elastic_sync.entity';
import { CarListService } from './service/cars_list.service';
import { CarsAddService } from './service/cars_add.service';
import { BrandService } from './service/brand.service';
import { CarDetailsService } from './service/car_details.service';
import { BodyListService } from './service/body_list.service';
import { CarModuleService } from './service/car_module.service';
import { CarSlideService } from './service/car_slide.service';
import { carImageAddService } from './service/car_image.service';
import { CarImageDeleteService } from './service/car_image_delete.service';
import { CarFeaturesService } from './service/car_features.service';
import { CarDropDownListService } from './service/car_dropdown.service';
import { CarDocumentAddService } from './service/car_document_add.service';
import { CarDocumentDeleteService } from './service/car_document_delete.service';
import { TestDriveDetailsEntity, TestDriveEntity } from './entities/test-drive.entity';
import { TestDriveListService } from './service/test_drive_list.service';
import { TestDriveAddService } from './service/test_drive_add.service';
import { TestDriveAddFrontService } from './service/test_drive_add_front.service';
import { TestDriveUpdateFrontService } from './service/test_drive_update_front.service';
import { TestDriveDetailsService } from './service/test_drive_details.service';
import { TestDriveUpdateService } from './service/test_drive_update.service';
import { CarWishlistService } from './service/car_wishlist.service';
import { CarListFrontService } from './service/car_list_front.service';
import { CarFrontDetailsService } from './service/car_front_details.service';
import { CarController } from './car.controller';
import { CarCompareDetailsService } from './service/car_compare.service';
import { CarPublishUpdateService } from './service/car_publish_update.service';
import { LocationtimeSlotService } from './service/location_timelot.service';
import { Booking, BookingCharges, BookingService } from './entities/booking.entity';
import { BookingAddService } from './service/booking_add.service';
import { ChargesEntity } from './entities/charges.entity';
import { Payment } from './entities/payment.entity';
import { GlobalModule } from '@repo/source/modules/global.module';
import { CarMicroserviceService } from './service/car_microservice.service';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([
      BodyEntity,
      CarTagsEntity,
      BrandEntity,
      CarFeatureEntity,
      ModelEntity,
      SyncElasticEntity,
      CarEntity,
      CarDetailsEntity,
      CarHistoryEntity,
      CarTagEntity,
      CarDocumentEntity,
      CarImagesEntity,
      TestDriveEntity,
      TestDriveDetailsEntity,
      CarWishlistEntity,
      Booking,
      Payment,
      ChargesEntity,
      BookingCharges,
      BookingService,
      LookupEntity,
    ]),

  ],
  controllers: [CarController],
  providers: [
    CarTagAddService,
    CarTagsAddService,
    CarFeatureAddService,
    CarModelDetailsService,
    CarFeaturesService,
    CarDropDownListService,
    CarListService,
    CarsAddService,
    BrandService,
    CarDetailsService,
    BodyListService,
    CarModuleService,
    CarSlideService,
    carImageAddService,
    CarImageDeleteService,
    BodyAddService,
    ModelAddService,
    BodyTypeDetailsService,
    CarDocumentAddService,
    CarDocumentDeleteService,
    TestDriveListService,
    TestDriveAddService,
    TestDriveAddFrontService,
    TestDriveUpdateFrontService,
    TestDriveDetailsService,
    TestDriveUpdateService,
    CarWishlistService,
    CarListFrontService,
    CarFrontDetailsService,
    CarCompareDetailsService,
    CarPublishUpdateService,
    LocationtimeSlotService,
    BookingAddService,
    GlobalModule,
    CarMicroserviceService
  ],
})
export class CarModule { }
