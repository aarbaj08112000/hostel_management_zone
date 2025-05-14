interface AuthObject {
  user: any;
}
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ConfigService } from '@nestjs/config';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class CarFrontCompareService {
  protected readonly log = new LoggerHandler(
    CarFrontCompareService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  private keycloakUrl: string;
  private keycloakRealm: string;
  protected requestObj: AuthObject = {
    user: {},
  };
  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;
  constructor(
    protected readonly elasticService: ElasticService,
    protected readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
  }
  async startCarDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getCarDetails(inputParams);

      if (!_.isEmpty(inputParams.car_details)) {
        outputResponse = this.carDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_details >>', err);
    }
    return outputResponse;
  }
  async getCarDetails(inputParams: any) {
    this.blockResult = {};
    try {
      let fileConfig: FileFetchDto;
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions =
        await this.general.getConfigItem('allowed_extensions');
      let _source = [
        "regionName",
        "steeringSide",
        "exteriorColorName",
        "exteriorColor",
        "interiorColorName",
        "interiorColor",
        "export_status",
        "accidentalHistory",
        "insuranceType",
        "locationName",
        "latitude",
        "longitude",
        "locationAddress",
        "engineSize",
        "tag_information",
        "carId",
        "carName",
        "price",
        "drivenDistance",
        "car_slug",
        "transmissionType",
        "car_image",
        "added_date",
        "bodyName",
        "fuelType",
        "engineCapacity",
        "manufactureYear",
        "seatingCapacity",
        "horsePower",
        "exteriorColorName",
        "numberOfDoors",
        "warranty",
        "isListed",
        "brandName",
        "modelName",
        "model_name",
        "location_id",
        "status",
        "display_title",
        "batteryCapacity",
        "chargingTime",
        "range",
        "zipCode",
        "driveType",
        "interiorImages",
        "exteriorImages"
      ]
      let { search_key, search_by, index } = inputParams;
      search_key = search_key.split(',')
      const carDataArray = await this.elasticService.getById(
        search_key,
        index,
        search_by,
        '',
        _source
      );

      for (let data of carDataArray) {
        let images = {}; 

        if (data?.car_image !== '') {
          fileConfig.image_name = data['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
          data.primaryImage = await this.general.getFile(fileConfig, inputParams);
        }
      
        data.modelName = data.model_name;
        data.engineCapacity = data?.engineCapacity
          ? this.general.numberFormat(data?.engineCapacity, 'numerical')
          : '';
        data.drivenDistance = data?.drivenDistance
          ? this.general.numberFormat(data?.drivenDistance, 'numerical')
          : '';
        data.distanceSuffix = 'km';
        data.carSlug = data.car_slug;
        data.currencyCode = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');
        data.formattedPrice = data?.price
          ? this.general.numberFormat(data.price, 'currency', 'AED')
          : '';
        data.rating = '4.4';
        data.horsePowerSuffix = 'HP';
        data.transmissionSuffix = 'Transmission';
        data.seatingCapacitySuffix = 'Seater';
        data.engineSuffix = 'CC';
        data.noOfCylinders = '6';
        data.added_date = this.general.timeAgo(data.added_date);
        data.engineSizeSuffix = 'L';
      
        // EV-specific tag
        if (data['fuelType'] === 'Electric') {
          data.vehicleType = 'ev';
        }

        if (data['interiorImages'] && Array.isArray(data['interiorImages'])) {
          data['interiorImages'] = await Promise.all(
            data['interiorImages'].map(async (imageName) => {
              fileConfig.image_name = imageName.split(':')[1];
              fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
              return await this.general.getFile(fileConfig, inputParams);
            }),
          );
        }
        if (data['exteriorImages'] && Array.isArray(data['exteriorImages'])) {
          data['exteriorImages'] = await Promise.all(
            data['exteriorImages'].map(async (imageName) => {
              fileConfig.image_name = imageName.split(':')[1];
              fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
              return await this.general.getFile(fileConfig, inputParams);
            }),
          );
        }
      }
      console.log(carDataArray)
      if (_.isObject(carDataArray) && !_.isEmpty(carDataArray)) {
        const success = 1;
        const message = 'Records found.';

        const queryResult = {
          success,
          message,
         data :  carDataArray,
        };
        this.blockResult = queryResult;
      } else {
        throw new Error('No records found.');
      }
    } catch (err) {
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.car_details = this.blockResult.data;
    return inputParams;
  }

  carDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('car details found.'),
      fields: [],
    };
    settingFields.fields = [
      "carName",
      "price",
      "drivenDistance",
      "carSlug",
      "fuelType",
      "transmissionType",
      "bodyName",
      "analytics",
      "interiorImages",
      "exteriorImages",
      "engineCapacity",
      "manufactureYear",
      "seatingCapacity",
      "overviewTitle",
      "overviewTitle",
      "features",
      "horsePower",
      "exteriorColorName",
      "numberOfDoors",
      "primaryImage",
      "formattedPrice",
      "distanceSuffix",
      "currencyCode",
      "latitude",
      "longitude",
      "locationAddress",
      "contactDetails",
      "isWishList",
      "rating",
      "horsePowerSuffix",
      "transmissionSuffix",
      "seatingCapacitySuffix",
      "locationTiming",
      "engineSuffix",
      "noOfCylinders",
      "warranty",
      "brandName",
      "modelName",
      "status",
      "added_date",
      "display_title",
      "batteryCapacity",
      "chargingTime",
      "range",
      "vehicleType",
      "tag_information",
      "locationName",
      "zipCode",
      "engineSize",
      "engineSizeSuffix",
      "driveType",
      "regionName",
      "steeringSide",
      "exteriorColorName",
      "exteriorColor",
      "interiorColorName",
      "interiorColor",
      "export_status",
      "accidentalHistory",
      "insuranceType",
      "locationName",
      "latitude",
      "longitude",
      "locationAddress",
      "exteriorImages",
      "interiorImages"
    ];
    if ('location_enabled' in inputParams && inputParams.location_enabled == 'Yes') {
      settingFields.fields.push('location_id', 'carId', 'operating_hours')
    }
    const outputKeys = ['car_details'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;
    const funcData: any = {};
    funcData.name = 'car_details';

    funcData.output_keys = outputKeys;
    funcData.singleKeys = this.singleKeys;
    let response = this.response.outputResponse(outputData, funcData);
    return response
  }
  carDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('car details not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_details',
      },
    );
  }
}