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
export class CarCompareDetailsService {
  protected readonly log = new LoggerHandler(
    CarCompareDetailsService.name,
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
        "carId",
        "carName",
        "price",
        "drivenDistance",
        "car_slug",
        "fuelType",
        "transmissionType",
        "car_image",
        "bodyName",
        "fuelType",
        "engineCapacity",
        "manufactureYear",
        "seatingCapacity",
        "shortDescription",
        "carDescription",
        "horsePower",
        "exteriorColorName",
        "numberOfDoors",
        "modelName",
        "model_name",
        "brandName",
        "status",
        "isListed",
        "display_title"
      ]
      let { search_key, search_by, index } = inputParams;
      let images = {};
      let data = await this.elasticService.getById(
        search_key,
        index,
        search_by,
        '',
        _source
      );
      data = data.filter(car => car.isListed !== 'No' && (car.status == 'Booked' || car.status == 'Available'));
      for (const car of data) {
        if (car.car_image) {
          fileConfig.image_name = car['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${car['carId']}`;
          car.car_image = await this.general.getFile(fileConfig, inputParams);
        } else {
          car.car_image = '';
        }

        if (car.engineCapacity) {
          car.engineCapacity = this.general.numberFormat(car.engineCapacity, 'numerical');
        } else {
          car.engineCapacity = '';
        }

        if (car.drivenDistance) {
          car.drivenDistance = this.general.numberFormat(car.drivenDistance, 'numerical');
        } else {
          car.drivenDistance = '';
        }
        if (car.price) {
          car.raw_price = car.price
          car.formattedPrice = this.general.numberFormat(car.price, 'currency', 'AED');
        } else {
          car.formattedPrice = '';
        }

        car.distanceSuffix = 'km';
        car.horsePowerSuffix = 'HP';
        car.engineSuffix = 'CC';
        car.noOfCylinders = '6';
        car.modelName = car.model_name;
        car.currencyCode = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');
      }


      if (_.isObject(data) && !_.isEmpty(data)) {
        const success = 1;
        const message = 'Records found.';

        const queryResult = {
          success,
          message,
          data,
        };
        this.blockResult = queryResult;
      } else {
        throw new Error('No records found.');
      }
    } catch (err) {
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
      "carId",
      "carName",
      "price",
      "drivenDistance",
      "car_slug",
      "fuelType",
      "transmissionType",
      "car_image",
      "added_date",
      "bodyName",
      "analytics",
      "interiorImages",
      "exteriorImages",
      "fuelType",
      "engineCapacity",
      "manufactureYear",
      "seatingCapacity",
      "shortDescription",
      "carDescription",
      "horsePower",
      "exteriorColorName",
      "numberOfDoors",
      "primaryImage",
      "formattedPrice",
      "distanceSuffix",
      "currencyCode",
      "horsePowerSuffix",
      "engineSuffix",
      "noOfCylinders",
      "modelName",
      "brandName",
      "status",
      "display_title",
      "raw_price"
    ];
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
