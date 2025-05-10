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
import { CarWishlistService } from './service/car_wishlist.service';
import { CarListFrontService } from './service/car_list_front.service';
import { CarFrontDetailsService } from './service/car_front_details.service';
import { CarController } from './car.controller';
import { CarCompareDetailsService } from './service/car_compare.service';
import { CarPublishUpdateService } from './service/car_publish_update.service';
import { LocationtimeSlotService } from './service/location_timelot.service';
import { GlobalModule } from '@repo/source/modules/global.module';
import { CarMicroserviceService } from './service/car_microservice.service';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { BrandAddService } from './service/brand_add.service';
import { BrandDetailsService } from './service/brand_details.service';
import { VariantMasterAddService } from './service/variant_master_add.service';
import { VariantMasterEntity } from './entities/variant-master.entity';
import { VariantDetailsService } from './service/variant_details.service';
import { VariantListService } from './service/variant_list.service';
import { TagMasterDetailsService } from './service/tag_master_details.service';
import { CarChargesService } from './service/car_charges_add.service';
import { CarChargesEntity } from './entities/car_charges.entity';
import { CarServicesAdd } from './service/car_service_add.service';
import { CarServicesEntity } from './entities/car_services.entity';
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
      CarWishlistEntity,
      LookupEntity,
      VariantMasterEntity,
      CarChargesEntity,
      CarServicesEntity
    ]),

  ],
  controllers: [CarController],
  providers: [
    BrandAddService,
    BrandDetailsService,
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
    CarWishlistService,
    CarListFrontService,
    CarFrontDetailsService,
    CarCompareDetailsService,
    CarPublishUpdateService,
    LocationtimeSlotService,
    GlobalModule,
    CarMicroserviceService,
    VariantMasterAddService,
    VariantDetailsService,
    VariantListService,
    TagMasterDetailsService,
    CarChargesService,
    CarServicesAdd
  ],
})
export class CarModule { }
