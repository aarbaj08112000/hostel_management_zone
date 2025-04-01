
import { CarController } from "./car.controller";
import {GlobalModule} from '@repo/source/modules/global.module'
import { BodyEntity } from "./entities/body.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from '@nestjs/common';
import { CarFeatureAddService } from './service/car_feature_add.service';
import { CarTagAddService } from './service/car_tag_add.service';
import { CarTagsAddService } from './service/car_tags_add.service';
import { BrandEntity } from '@repo/source/entities/brand.entity';
import { FeatureCategoryEntity } from '@repo/source/entities/feature-category-detail.entity';
import { FeatureEntity } from '@repo/source/entities/feature-detail.entity';
import { CarFeatureEntity } from './entities/cars.entity';
import { CarTagsEntity } from './entities/car-tag.entity';
import { ColorEntity } from '@repo/source/entities/color.entity';
import { ModelEntity } from '@repo/source/entities/model.entity';
import { InsuranceProviderEntity } from '@repo/source/entities/insurance-provider.entity';
import { LocationsEntity } from '@repo/source/entities/locations.entity';
import { RegionalSpecificationEntity } from '@repo/source/entities/regional-specification.entity';
import { TagMasterEntity } from '@repo/source/entities/tag-master.entity';
import { MetadataEntity } from '@repo/source/entities/meta.entity';
import { VariantMasterEntity } from '@repo/source/entities/variant-master.entity';
import { PageMasterEntity } from '@repo/source/entities/page_master.entity';
import { ModelAddService } from './service/model_add.service';
import { BodyAddService } from './service/body_add.service';

import { CarModelDetailsService } from './service/car_model_details.service';
import { AdminEntity } from '@repo/source/entities/admin.entity';
import { BodyTypeDetailsService } from './service/body_type_details.service';
import { CarEntity, CarHistoryEntity, CarTagEntity, CarDocumentEntity,CarWishlistEntity } from './entities/cars.entity';
import { CarDetailsEntity } from './entities/cars-detail.entity';
import { CarImagesEntity } from './entities/car_images.entity';

import { SyncElasticEntity } from '@repo/source/entities/elastic_sync.entity';
import { CarListService } from './service/cars_list.service';
import { CarsAddService } from './service/cars_add.service';
import { BrandService } from './service/brand.service';
import { InsuranceProviderService } from './service/insurance_provider.service';
import { CarDetailsService } from './service/car_details.service';
import { BodyListService } from './service/body_list.service';
import { CarModuleService } from './service/car_module.service';
import { CarSlideService } from './service/car_slide.service';
import { FeatureListService } from './service/feature_list.service';
import { carImageAddService } from './service/car_image.service';
import { CarImageDeleteService } from './service/car_image_delete.service';
import { VariantListService } from './service/variant_list.service';
import { CarFeaturesService } from './service/car_features.service';
import { CarDropDownListService } from './service/car_dropdown.service';
import { ColorService } from './service/color.service';
import { CarDocumentAddService } from './service/car_document_add.service';
import { CarDocumentDeleteService } from './service/car_document_delete.service';
import { TestDriveEntity } from './entities/test-drive.entity';
import { TestDriveListService } from './service/test_drive_list.service';
import { TestDriveAddService } from './service/test_drive_add.service';
import { TestDriveDetailsService } from './service/test_drive_details.service';
import { CarWishlistService } from './service/car_wishlist.service';
import { CarListFrontService } from './service/car_list_front.service';
import { CarFrontDetailsService } from './service/car_front_details.service';
import { CustomerEntity } from '@repo/source/entities/customer.entity';
import { CarCompareDetailsService } from "./service/car_compare.service";
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([
      BodyEntity,
      CarTagsEntity,
      BrandEntity,
      FeatureCategoryEntity,
      FeatureEntity,
      TagMasterEntity,
      CarFeatureEntity,
      ModelEntity,
      InsuranceProviderEntity,
      LocationsEntity,
      RegionalSpecificationEntity,
      ColorEntity,
      MetadataEntity,
      VariantMasterEntity,
      PageMasterEntity,
      AdminEntity,
      SyncElasticEntity,
      CarEntity,
      CarDetailsEntity,
      CarHistoryEntity,
      CarTagEntity,
      CarDocumentEntity,
      CarImagesEntity,
      TestDriveEntity,
      CarWishlistEntity,
      CustomerEntity
    ]),

  ],
  controllers: [CarController],
  providers: [
    CarTagAddService,
    CarTagsAddService,
    CarFeatureAddService,
    CarModelDetailsService,
    VariantListService,
    CarFeaturesService,
    CarDropDownListService,
    CarListService,
    CarsAddService,
    BrandService,
    InsuranceProviderService,
    CarDetailsService,
    BodyListService,
    CarModuleService,
    CarSlideService,
    FeatureListService,
    carImageAddService,
    CarImageDeleteService,
    BodyAddService,
    ModelAddService,
    BodyTypeDetailsService,
    ColorService,
    CarDocumentAddService,
    CarDocumentDeleteService,
    TestDriveListService,
    TestDriveAddService,
    TestDriveDetailsService,
    CarWishlistService,
    CarListFrontService,
    CarFrontDetailsService,
    CarCompareDetailsService,
    GlobalModule
  ],
})
export class CarModule{}