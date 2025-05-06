interface AuthObject { user: any; }
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';

import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { CarEntity, CarHistoryEntity, CarTagEntity, CarDocumentEntity } from '../entities/cars.entity';
import { CarDetailsEntity } from '../entities/cars-detail.entity';
import { BaseService } from '@repo/source/services/base.service';
import { CarMicroserviceService } from './car_microservice.service';
import { BrandEntity } from '../entities/brand.entity';
import { ModelEntity } from '../entities/model.entity';

@Injectable()
export class CarsAddService extends BaseService {
  protected readonly log = new LoggerHandler(CarsAddService.name).getInstance();
  protected inputParams: object = {};
  protected serviceConfig: any;
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
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
  @Inject()
  protected readonly carMicroService : CarMicroserviceService
  @InjectRepository(CarEntity)
  protected carEntityRepo: Repository<CarEntity>;
  @InjectRepository(CarDetailsEntity)
  protected carEntityDetailsRepo: Repository<CarDetailsEntity>;
  @InjectRepository(CarHistoryEntity)
  protected carHistoryRepo: Repository<CarHistoryEntity>;
  @InjectRepository(CarTagEntity)
  protected carTagEntityRepo: Repository<CarTagEntity>;
  @InjectRepository(CarDocumentEntity)
  protected carDocumentRepo: Repository<CarDocumentEntity>;
  @InjectRepository(BrandEntity)
  protected brandRepo: Repository<BrandEntity>;
  @InjectRepository(ModelEntity)
  protected modelRepo: Repository<ModelEntity>;
  constructor() {
    super();
    this.moduleName = 'car';
  }
  async startCarAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      let success = 1;
      let response;
      let mode = 'Add';
      if ('car_id' in inputParams.car_data && inputParams.car_data.car_id) {
        mode = 'Update';
      }

      if (mode == 'Update') {
        this.setModuleAPI('update');

        let car_id = inputParams.car_data.car_id;
        inputParams = await this.customUniqueCondition(inputParams, car_id);
        if (typeof inputParams.car_data != 'undefined' && inputParams.car_result.unique_status === 1) {
          outputResponse = this.carsUniqueFailure(inputParams.car_result);
          success = 0;
        }
        if (
          typeof inputParams.car_details != 'undefined' &&
          inputParams.car_details_result.unique_status === 1
        ) {
          outputResponse = this.carsUniqueFailure(
            inputParams.car_details_result,
          );
          success = 0;
        }
        if (
          typeof inputParams.car_history != 'undefined' &&
          inputParams.car_history_details_result.unique_status === 1
        ) {
          outputResponse = this.carsUniqueFailure(
            inputParams.car_history_details_result,
          );
          success = 0;
        }
        if (success == 1) {
          let update_response = await this.updateCarData(inputParams, car_id);
          if (
            !_.isEmpty(inputParams.update_car_data.car_data) ||
            !_.isEmpty(inputParams.update_car_data.car_details) ||
            !_.isEmpty(inputParams.update_car_data.car_history) ||
            !_.isEmpty(inputParams.update_car_data.car_tag_data)
          ) {
            let message = this.blockResult.message;
            inputParams = {
              ...inputParams,
              message,
            };
            outputResponse = this.carsFinishSuccess(inputParams);
            let value_json = {
              "CAR_NAME": inputParams.car_data.car_name,
              "CAR_ID": inputParams.car_data.car_id,
              "UPDATED_BY": await this.general.getAdminName(inputParams.car_data.updated_by),
              "UPDATED_BY_ID": inputParams.car_data.updated_by
            }

            await this.general.addActivity(this.moduleName, this.moduleAPI, inputParams.car_data.updated_by, value_json, inputParams.car_data.car_id);
            return outputResponse;
          } else {
            outputResponse = this.carsFinishFailure(inputParams);
          }
        }
      }

      if (mode == 'Add') {
        this.setModuleAPI('add');
        inputParams = await this.customUniqueCondition(inputParams);
        if (inputParams.car_result.unique_status === 1) {
          outputResponse = this.carsUniqueFailure(inputParams.car_result);
          success = 0;
        }
        if (
          typeof inputParams.car_details != 'undefined' &&
          inputParams.car_details_result.unique_status === 1
        ) {
          outputResponse = this.carsUniqueFailure(
            inputParams.car_details_result,
          );
          success = 0;
        }
        if (
          typeof inputParams.car_history != 'undefined' &&
          inputParams.car_history_details_result.unique_status === 1
        ) {
          outputResponse = this.carsUniqueFailure(
            inputParams.car_history_details_result,
          );
          success = 0;
        }
        if (success == 1) {
          let car_add_response = await this.insertCarData(inputParams.car_data);
          response = car_add_response;
          if (!_.isEmpty(car_add_response.insert_car_data)) {
            if (typeof inputParams.car_details != 'undefined') {
              let car_id = car_add_response.insert_id;
              inputParams.car_details = { ...inputParams.car_details, added_by: inputParams?.car_data?.added_by }
              let detailOutput = await this.insertCarDetails(
                inputParams.car_details,
                car_id,
              );
              if (!_.isEmpty(detailOutput.insert_car_details_data)) {
                response = {
                  ...response,
                  detailOutput,
                };
              }
            }
            if (typeof inputParams.car_history != 'undefined') {
              let car_id = car_add_response.insert_id;
              inputParams.car_history = { ...inputParams.car_history, added_by: inputParams?.car_data?.added_by }
              let historydetailOutput = await this.insertCarHistoryDetails(
                inputParams.car_history,
                car_id,
              );
              if (
                !_.isEmpty(historydetailOutput.insert_car_history_details_data)
              ) {
                response = {
                  ...response,
                  historydetailOutput,
                };
              }
            }
            if (typeof inputParams.car_tags != 'undefined') {
              inputParams.car_tags = { ...inputParams.car_tags, added_by: inputParams?.car_data?.added_by }
              let car_id = car_add_response.insert_id;
              let tagDetailOutput = await this.insertCarTags(
                inputParams.car_tags,
                car_id,
              );
              if (!_.isEmpty(tagDetailOutput.insert_car_tag_data)) {
                response = {
                  ...response,
                  tagDetailOutput,
                };
              }
            }
            outputResponse = this.carsFinishSuccess(response);
            let value_json = {
              "CAR_NAME": inputParams.car_data.car_name,
              "CAR_ID": response.insert_id,
              "ADDED_BY": await this.general.getAdminName(inputParams.car_data.added_by),
              "ADDED_BY_ID": inputParams.added_by
            }
            await this.general.addActivity(this.moduleName, this.moduleAPI, inputParams.car_data.added_by, value_json, response.insert_id);
          } else {
            outputResponse = this.carsFinishFailure(response);
          }
        }
      }
    } catch (err) {
      console.log(err);
      this.log.error('API Error >> car_add >>', err);
    }
    return outputResponse;
  }
  async customUniqueCondition(inputParams: any, car_id?: any) {
    let formatData: any = {};
    let { car_data, car_details, car_history } = inputParams;
    try {
      //@ts-ignore
      let result = {};
      if (car_data) {
        car_data = { ...car_data, id: car_id };
        this.serviceConfig = {
          module_name: 'cars_add',
          table_name: 'cars',
          table_alias: 'ca',
          primary_key: 'carId',
          primary_alias: 'ca_id',
          unique_fields: {
            type: 'and',
            fields: {
              slug: 'slug',
              car_id: 'carId'
            },
            message:
              'Record already exists with these details of Car Id or Slug',
          },
          expRefer: {},
          topRefer: {},
        };
        let car_result = await this.checkUniqueCondition(car_data);
        // result['car_result'] = car_result;
        result['car_result'] =  {
          car_result : {unique_status : 0}
        }
      }
      if (car_details) {
        car_details = { ...car_details, id: car_id, carId: car_id }
        this.serviceConfig = {
          module_name: 'cars_details',
          table_name: 'cars_details',
          table_alias: 'cad',
          primary_key: 'carId',
          primary_alias: 'cad_id',
          unique_fields: {
            type: 'or',
            fields: {
              vin_number: 'vinNumber',
              chassis_number: 'chassisNumber'
            },
            message:
              'Record already exists with these details of vin_number or chassis_number.',
          },
          expRefer: {},
          topRefer: {},
        };
        let car_details_result = await this.checkUniqueCondition(car_details, 'Yes');
        result['car_details_result'] = car_details_result;
      }
      if (car_history) {
        car_history = { ...car_history, id: car_id, carId: car_id }
        this.serviceConfig = {
          module_name: 'car_history',
          table_name: 'car_history',
          table_alias: 'ch',
          primary_key: 'carId',
          primary_alias: 'ch_id',
          unique_fields: {
            // commented by utkarsha reason: as per instruntion from admin team to make registration_number optional
            // type: 'and',
            // fields: {
            // registration_number: 'registrationNumber',
            // },
            // message:
            //   'Record already exists with these details of Car Id or Car Registration Number',
          },
          expRefer: {},
          topRefer: {},
        };
        let car_history_details_result =
          await this.checkUniqueCondition(car_history);
        result['car_history_details_result'] = car_history_details_result;
      }
      formatData = this.response.assignFunctionResponse(result);
      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }
  carsUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang(`${inputParams.unique_message}`),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_add',
      },
    );
  }
  async insertCarData(inputParams: any) {

    let uploadResult: any = {};
    let uploadConfig: any = {};
    let uploadInfo: any = {};
    let fileProp: any = {};
    let fileInfo: any = {};
    fileInfo = await this.processFiles(inputParams);
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      for (let key in inputParams) {
        if (inputParams[key] === '') {
          inputParams[key] = null;
        }
      }
      if ('car_name' in inputParams) {
        queryColumns.carName = inputParams.car_name;
      }
      if ('car_description' in inputParams) {
        queryColumns.carDescription = inputParams.car_description;
      }
      if ('price' in inputParams) {
        queryColumns.price = inputParams.price;
      }
      // if ('slug' in inputParams) {
      //   queryColumns.slug = inputParams.slug;
      // }
      if ('remarks' in inputParams) {
        queryColumns.remarks = inputParams.remarks;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('short_description' in inputParams) {
        queryColumns.shortDescription = inputParams.short_description;
      }
      if ('contact_person_id' in inputParams) {
        queryColumns.contactPersonId = inputParams.contact_person_id;
      }
      if ('car_image' in inputParams) {
        queryColumns.carImage = inputParams.car_image
      }
      if ('overview_title' in inputParams) {
        queryColumns.overviewTitle = inputParams.overview_title
      }
      if ('is_listed' in inputParams) {
        queryColumns.isListed = inputParams.is_listed
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by
      }
      if ('location_id' in inputParams) {
        queryColumns.locationId = inputParams.location_id
      }
      if ('export_status' in inputParams) {
        queryColumns.exportStatus = inputParams.export_status
      }
      let code = await this.general.getCustomToken('cars', '', 'Add');
      if (code != '') {
        queryColumns.carCode = code;
      }
      const queryObject = this.carEntityRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };
      uploadResult = await this.uploadFiles(
        fileInfo,
        inputParams,
        data.insert_id,
      );
      const success = 1;
      const message = 'Record(s) inserted.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_car_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }

  async updateCarData(inputParams: any, car_id: any) {
    try {
      let uploadResult: any = {};
      let uploadConfig: any = {};
      let uploadInfo: any = {};
      let fileProp: any = {};
      let fileInfo: any = {};
      if (inputParams?.car_data?.updated_by && inputParams?.car_data?.updated_by != '') {
        inputParams.car_details = { ...inputParams.car_details, updated_by: inputParams.car_data.updated_by }
        inputParams.car_history = { ...inputParams.car_history, updated_by: inputParams.car_data.updated_by }
      }
      const { car_data, car_details, car_history, car_tags } = inputParams;
      let {
        existed_car_data,
        existed_car_details,
        existed_car_history_details,
        existed_car_tag_data,
      } = await this.fetchCarData(car_id);

      const car_data_mapping: Record<string, string> = {
        car_name: 'carName',
        car_description: 'carDescription',
        price: 'price',
        car_image: 'carImage',
        remarks: 'remarks',
        status: 'status',
        short_description: 'shortDescription',
        contact_person_id: 'contactPersonId',
        overview_title: 'overviewTitle',
        is_listed: 'isListed',
        updated_by: 'updatedBy',
        location_id: 'locationId',
        export_status: 'exportStatus',
        slug: 'slug'
      };
      const car_details_field_mapping: Record<string, string> = {
        chassis_number: 'chassisNumber',
        brand_id: 'brandId',
        model_id: 'modelId',
        body_id: 'bodyTypeid',
        fuel_type: 'fuelType',
        vin_number: 'vinNumber',
        manufacture_year: 'manufactureYear',
        manufacture_month: 'manufactureMonth',
        country_id: 'countryId',
        transmission_type: 'transmissionType',
        drive_type: 'driveType',
        engine_capacity: 'engineCapacity',
        engine_size: 'engineSize',
        horse_power: 'horsePower',
        battery_capacity: 'batteryCapacity',
        charging_time: 'chargingTime',
        range: 'range',
        exterior_colorId: 'exteriorColorId',
        interior_colorId: 'interiorColorId',
        steering_side: 'steeringSide',
        regional_specsId: 'regionalSpecsId',
        driven_distance: 'drivenDistance',
        seating_capacity: 'seatingCapacity',
        number_Of_doors: 'numberOfDoors',
        variant_id: 'variantId',
        updated_by: 'updatedBy',
        negotiable: 'negotiable',
        negotiable_range: 'negotiableRange',
        monthly_emi_amount: 'monthlyEMIAmount',
      };
      const car_history_data_mapping: Record<string, string> = {
        registration_number: 'registrationNumber',
        registration_date: 'registrationDate',
        registration_expiry: 'registrationExpiry',
        insurance_type: 'insuranceType',
        insurance_expiry: 'insuranceExpiry',
        accident_history: 'accidentHistory',
        insurance_provider_id: 'insuranceProvideId',
        insurance_policy_number: 'insurancePolicyNumber',
        is_coletral: 'isColetral',
        coletral_with: 'coletralWith',
        accidental_history: 'accidentalHistory',
        after_market_modification: 'afterMarketModification',
        updated_by: 'updatedBy',
        service_history: 'serviceHistory',
        warranty: 'warranty',
        owner_number: 'ownerNumber',
      };
      const car_tag_data_mapping: Record<string, string> = {
        tag_id: 'tagId',
        car_id: 'carId',
      };
      const car_feature_data_mapping: Record<string, string> = {
        feature_id: 'featureId',
        car_id: 'carId',
      };

      let data;
      if (car_data) {
        fileInfo = await this.processFiles(car_data);
        const carQueryColumns: any = {};
        Object.keys(car_data_mapping).forEach((key) => {
          if (key in car_data) {
            carQueryColumns[car_data_mapping[key]] = car_data[key] ? car_data[key] : null;
          }
        });
        carQueryColumns.updatedDate = () => 'NOW()';
        if (!_.isEmpty(carQueryColumns) && !_.isEmpty(existed_car_data)) {
          const queryObject = this.carEntityRepo
            .createQueryBuilder()
            .update(CarEntity)
            .set(carQueryColumns);
          if (car_id) {
            queryObject.andWhere('carId = :id', { id: car_id });
          }

          const res = await queryObject.execute();
          data = {
            car_data: {
              affected_rows: res.affected,
            },
          };
          const selObject = this.carEntityRepo.createQueryBuilder('c');
          selObject.select([
            'c.carId as carId',
            'c.carName as name',
            'c.slug as slug',
            'c.carImage as carImage',
            'c.price as price',
            'c.locationId as locationId',
            'c.contactPersonId as contactPersonId',
            'cd.manufactureYear as manufactureYear',
            'cd.drivenDistance as drivenDistance',
            'cd.fuelType as fuelType',
            'cd.transmissionType as transmissionType',
          ])
          .leftJoin('cars_details', 'cd', 'c.carId = cd.car_id')
          selObject.where('c.carId = :id', { id: car_id });
          const sel_data = await selObject.getRawOne();
          let micro_data : any = {
            id : car_id,
            mode : 'update',
            data : sel_data,
            module : 'car',
          }
          await this.carMicroService.sendData(micro_data)
          uploadResult = await this.uploadFiles(fileInfo, inputParams, car_id);
        }
      }

      if (car_details) {
        const carDetailsColumn: any = {};
        Object.keys(car_details_field_mapping).forEach((key) => {
          if (key in car_details) {
            carDetailsColumn[car_details_field_mapping[key]] = car_details[key] ? car_details[key] : null;
          }
        });
        if (!_.isEmpty(carDetailsColumn) && !_.isEmpty(existed_car_details)) {
          carDetailsColumn.updatedDate = () => 'NOW()';
          const queryObject = this.carEntityDetailsRepo
            .createQueryBuilder()
            .update(CarDetailsEntity)
            .set(carDetailsColumn);
          if (car_id) {
            queryObject.andWhere('carId = :id', { id: car_id });
          }
          const res = await queryObject.execute();
          data['car_details'] = {
            affected_rows: res.affected,
          };
        } else {
          const res = this.insertCarDetails(car_details, car_id);
        }
      }
      if (car_history) {
        const carHistoryDetailColumn: any = {};
        Object.keys(car_history_data_mapping).forEach((key) => {
          if (key in car_history) {
            carHistoryDetailColumn[car_history_data_mapping[key]] =
              car_history[key] ? car_history[key] : null;
          }
        });

        if (
          !_.isEmpty(carHistoryDetailColumn) &&
          !_.isEmpty(existed_car_history_details)
        ) {
          carHistoryDetailColumn.updatedDate = () => 'NOW()';
          const queryObject = this.carHistoryRepo
            .createQueryBuilder()
            .update(CarHistoryEntity)
            .set(carHistoryDetailColumn);
          if (car_id) {
            queryObject.andWhere('carId = :id', { id: car_id });
          }
          const res = await queryObject.execute();
          data['car_history'] = {
            affected_rows: res.affected,
          };
        } else {
          const res = this.insertCarHistoryDetails(car_history, car_id);
        }
      }
      if (car_tags) {
        if (!_.isEmpty(existed_car_tag_data)) {
          const queryObject = this.carTagEntityRepo
            .createQueryBuilder()
            .delete();
          if (car_id) {
            queryObject.andWhere('carId = :id', { id: car_id });
          }
          const res = await queryObject.execute();
          data['car_tag_removed_data'] = {
            affected_removed_rows: res.affected,
          };
        }
        if (!_.isEmpty(car_tags)) {
          const res = await this.insertCarTags(car_tags, car_id);
          data['car_tag_data'] = {
            affected_modified_row: res.insert_car_tag_data.insert_id,
          };
        }
      }

      if (car_details?.brand_id && car_details?.model_id && car_details?.manufacture_year) {
        const brand = await this.brandRepo.findOne({ where: { brandId: car_details.brand_id } });
        const model = await this.modelRepo.findOne({ where: { carModelId: car_details.model_id } });
      
        if (brand?.brandName && model?.modelName) {
          const formattedBrand = brand.brandName.toLowerCase().replace(/\s+/g, '-');
          const formattedModel = model.modelName.toLowerCase().replace(/\s+/g, '-');
          const year = car_details.manufacture_year;
          let slug: string;
          let isUnique = false;
          
          while (!isUnique) {
            const uniqueNumber = Math.floor(10000000 + Math.random() * 90000000);
            slug = `${formattedBrand}-${formattedModel}-${year}-${uniqueNumber}`;
            const existingCar = await this.carEntityRepo.findOne({ where: { slug } });
            if (!existingCar) {
              isUnique = true;
            }
          }
          await this.carEntityRepo.update({ carId: car_id }, { slug });
        }
      }

      const success = 1;
      const message = 'Car updated successfully';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.update_car_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async insertCarDetails(inputParams: any, car_id: any) {
    try {
      inputParams = {
        ...inputParams,
        car_id,
      };
      for (let key in inputParams) {
        if (inputParams[key] === '') {
          inputParams[key] = null;
        }
      }
      const queryColumns: any = {};
      if ('car_id' in inputParams) {
        queryColumns.carId = inputParams.car_id;
      }
      if ('vin_number' in inputParams) {
        queryColumns.vinNumber = inputParams.vin_number;
      }
      if ('chassis_number' in inputParams) {
        queryColumns.chassisNumber = inputParams.chassis_number;
      }
      if ('brand_id' in inputParams) {
        queryColumns.brandId = inputParams.brand_id;
      }
      if ('model_id' in inputParams) {
        queryColumns.modelId = inputParams.model_id;
      }
      if ('body_id' in inputParams) {
        queryColumns.bodyTypeid = inputParams.body_id;
      }
      if ('fuel_type' in inputParams) {
        queryColumns.fuelType = inputParams.fuel_type;
      }
      if ('manufacture_year' in inputParams) {
        queryColumns.manufactureYear = inputParams.manufacture_year;
      }
      if ('manufacture_month' in inputParams) {
        queryColumns.manufactureMonth = inputParams.manufacture_month;
      }
      if ('country_id' in inputParams) {
        queryColumns.countryId = inputParams.country_id;
      }
      if ('transmission_type' in inputParams) {
        queryColumns.transmissionType = inputParams.transmission_type;
      }
      if ('drive_type' in inputParams) {
        queryColumns.driveType = inputParams.drive_type;
      }
      if ('engine_capacity' in inputParams) {
        queryColumns.engineCapacity = inputParams.engine_capacity;
      }
      if ('engine_size' in inputParams) {
        queryColumns.engineSize = inputParams.engine_size;
      }
      if ('horse_power' in inputParams) {
        queryColumns.horsePower = inputParams.horse_power;
      }
      if ('battery_capacity' in inputParams) {
        queryColumns.batteryCapacity = inputParams.battery_capacity;
      }
      if ('charging_time' in inputParams) {
        queryColumns.chargingTime = inputParams.charging_time;
      }
      if ('range' in inputParams) {
        queryColumns.range = inputParams.range;
      }
      if ('exterior_colorId' in inputParams) {
        queryColumns.exteriorColorId = inputParams.exterior_colorId;
      }
      if ('interior_colorId' in inputParams) {
        queryColumns.interiorColorId = inputParams.interior_colorId;
      }
      if ('steering_side' in inputParams) {
        queryColumns.steeringSide = inputParams.steering_side;
      }
      if ('regional_specsId' in inputParams) {
        queryColumns.regionalSpecsId = inputParams.regional_specsId;
      }
      if ('driven_distance' in inputParams) {
        queryColumns.drivenDistance = inputParams.driven_distance;
      }
      if ('seating_capacity' in inputParams) {
        queryColumns.seatingCapacity = inputParams.seating_capacity;
      }
      if ('number_Of_doors' in inputParams) {
        queryColumns.numberOfDoors = inputParams.number_Of_doors;
      }
      if ('variant_id' in inputParams) {
        queryColumns.variantId = inputParams.variant_id;
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by
      }
      if ('negotiable' in inputParams) {
        queryColumns.negotiable = inputParams.negotiable;
      }
      if ('negotiable_range' in inputParams) {
        queryColumns.negotiableRange = inputParams.negotiable_range;
      }
      if ('monthly_emi_amount' in inputParams) {
        queryColumns.monthlyEMIAmount = inputParams.monthly_emi_amount;
      }
      const queryObject = this.carEntityDetailsRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };
      const success = 1;
      const message = 'Record(s) inserted.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_car_details_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async insertCarHistoryDetails(inputParams: any, car_id: any) {
    try {
      const car_history_data_mapping: Record<string, string> = {
        car_id: 'carId',
        registration_number: 'registrationNumber',
        registration_date: 'registrationDate',
        registration_expiry: 'registrationExpiry',
        insurance_type: 'insuranceType',
        insurance_expiry: 'insuranceExpiry',
        accident_history: 'accidentHistory',
        insurance_provider_id: 'insuranceProvideId',
        insurance_policy_number: 'insurancePolicyNumber',
        is_coletral: 'isColetral',
        coletral_with: 'coletralWith',
        accidental_history: 'accidentalHistory',
        after_market_modification: 'afterMarketModification',
        added_by: 'addedBy',
        service_history: 'serviceHistory',
        warranty: 'warranty',
        owner_number: 'ownerNumber',
      };
      inputParams = {
        ...inputParams,
        car_id,
      };
      const queryColumns: any = {};
      Object.keys(car_history_data_mapping).forEach((key) => {
        if (key in inputParams) {
          queryColumns[car_history_data_mapping[key]] = inputParams[key] ? inputParams[key] : null;
        }
      });

      const queryObject = this.carHistoryRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };
      const success = 1;
      const message = 'Record(s) inserted.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_car_history_details_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }
  async insertCarTags(inputParams: any, car_id: any) {
    try {
      inputParams = {
        ...inputParams,
        car_id,
      };
      const car_tag_data_mapping: Record<string, string> = {
        tag_id: 'tagId',
        car_id: 'carId',
      };
      const queryColumns: any = [];
      Object.values(inputParams.tag_ids).forEach((tag_data) => {
        const mapped_data = {};
        mapped_data[car_tag_data_mapping['car_id']] = car_id;
        mapped_data[car_tag_data_mapping['tag_id']] = tag_data;
        queryColumns.push(mapped_data);
      });

      const queryObject = this.carTagEntityRepo;
      const res = await queryObject.save(queryColumns);

      const data = {
        insert_id: res.map((entry) => entry.carTagId),
      };
      const success = 1;
      const message = 'Record(s) inserted.';

      const queryResult = {
        success,
        message,
        data,
      };

      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_car_tag_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }
  async insertCarDocument(inputParams: any, car_id: any) {
    try {
      let uploadInfo: any = {};
      let fileInfo: any = {};
      let uploadResult: any = {};
      inputParams = this.general.removeEmptyKeys(inputParams)
      uploadInfo = {
        car_document: this.general.removeEmptyKeys(inputParams)
      }
      fileInfo = await this.processFiles(uploadInfo);

      const car_document_mapping: Record<string, string> = {
        file_name: 'documentTypeId',
        uploaded_name: 'documentTitle',
        car_id: 'carId',
        added_by: 'addedBy'
      };

      const queryColumns: any = [];
      Object.values(inputParams).forEach((item) => {
        const mapped_data = {};
        mapped_data[car_document_mapping['car_id']] = car_id;
        mapped_data[car_document_mapping['file_name']] = item['file_name'];
        mapped_data[car_document_mapping['uploaded_name']] = item['uploaded_name'];
        queryColumns.push(mapped_data);
      });
      const queryObject = this.carDocumentRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };
      uploadResult = await this.uploadFiles(
        fileInfo,
        inputParams,
        car_id,
      );
      const success = 1;
      const message = 'Record(s) inserted.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_car_document_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }
  async fetchCarData(car_id: any) {
    try {
      const existed_car_data = await this.carEntityRepo.findOne({
        where: { carId: car_id },
      });
      const existed_car_details = await this.carEntityDetailsRepo.findOne({
        where: { carId: car_id },
      });
      const existed_car_history_details = await this.carHistoryRepo.findOne({
        where: { carId: car_id },
      });
      const existed_car_tag_data = await this.carTagEntityRepo.find({
        where: { carId: car_id },
      });
      return {
        existed_car_data,
        existed_car_details,
        existed_car_history_details,
        existed_car_tag_data,
      };
    } catch (err) {
      console.log(err);
    }
  }
  async carsFinishSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: inputParams.message
        ? custom.lang(inputParams.message)
        : custom.lang('Cars added successfully.'),
      fields: [],
    };
    settingFields.fields = [
      'insert_id',
      'affected_rows',
      'insert_car_data',
      'update_car_data',
      'affected_removed_rows',
      'affected_modified_row',
    ];

    const outputKeys = ['insert_car_data', 'update_car_data'];
    const outputAliases = {
      insert_id: 'insert_id',
      affected_rows: 'affected_rows',
    };
    const outputObjects = ['insert_car_data', 'update_car_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'cars_add';

    funcData.output_keys = outputKeys;
    funcData.output_alias = outputAliases;
    funcData.output_objects = outputObjects;
    funcData.single_keys = this.singleKeys;
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
        data: inputParams.insert_id ? inputParams.insert_id : inputParams?.car_data?.car_id
      },
    };
    await this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(outputData, funcData);
  }
  carsFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'cars_add',
      },
    );
  }
  async uploadFiles(uploadInfo, params, id?) {
    const uploadResults = {};
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');

    for (const key in uploadInfo) {
      const files = Array.isArray(uploadInfo[key]) ? uploadInfo[key] : [uploadInfo[key]];

      uploadResults[key] = [];
      for (const file of files) {
        if (!file.name) continue;

        const uploadConfig = {
          source: 'amazon',
          upload_path: `car_${key.includes('document') ? 'documents' : 'images'}_${aws_folder}/${id}/`,
          extensions: file.extensions,
          file_type: file.file_type,
          file_size: file.file_size,
          max_size: file.max_size,
          src_file: file.file_path,
          dst_file: file.name,
        };

        const result = await this.general.uploadFile(uploadConfig, params);
        uploadResults[key].push(result);
      }
    }

    return uploadResults;
  }

  async processFile(paramKey, uploadInfo, params) {
    const tmpUploadPath = await this.general.getConfigItem('upload_temp_path');
    const allowedExtensions = {
      car_document: 'pdf,doc,docx',
      default: 'gif,png,jpg,jpeg,jpe,bmp,ico,webp',
    };
    const maxSizes = {
      car_document: 512000, // 500 KB
      default: 102400, // 100 KB
    };

    if (!(paramKey in params) || custom.isEmpty(params[paramKey])) {
      return null;
    }

    if (paramKey === 'car_document') {
      let carDocuments = params[paramKey];
      uploadInfo[paramKey] = uploadInfo[paramKey] || [];

      for (const [, images] of Object.entries(carDocuments)) {
        // console.log(images)
        const fileInfo = await this.getFileInfo(tmpUploadPath, images['uploaded_name'], maxSizes.car_document, allowedExtensions.car_document);
        if (fileInfo) uploadInfo[paramKey].push(fileInfo);
      }
    } else {
      const fileInfo = await this.getFileInfo(tmpUploadPath, params[paramKey], maxSizes.default, allowedExtensions.default);
      if (fileInfo) uploadInfo[paramKey] = fileInfo;
    }

    return uploadInfo[paramKey] || null;
  }
  async getFileInfo(tmpUploadPath, fileName, maxSize, extensions) {
    const filePath = `${tmpUploadPath}${fileName}`;
    if (!this.general.isFile(filePath)) return null;

    return {
      name: fileName,
      file_name: fileName,
      file_path: filePath,
      file_type: this.general.getFileMime(filePath),
      file_size: this.general.getFileSize(filePath),
      max_size: maxSize,
      extensions: extensions,
    };
  }

  async processFiles(params) {
    let uploadInfo = {};

    await Promise.all([
      this.processFile.call(this, 'car_image', uploadInfo, params),
      this.processFile.call(this, 'car_other_images', uploadInfo, params),
      this.processFile.call(this, 'car_document', uploadInfo, params),
    ]);

    return uploadInfo;
  }
  async checkUniqueCondition(inputParams: any, is_empty?: string) {
    const uniqueFields = this.serviceConfig.unique_fields?.fields;
    const uniqueType = this.serviceConfig.unique_fields?.type;

    let uniqueStatus = 0;
    let uniqueMessage = '';

    if (_.isObject(uniqueFields) && !_.isEmpty(uniqueFields)) {
      const queryConfig: any = {};
      queryConfig.table_name = this.serviceConfig.table_name;
      queryConfig.select_type = 'count';
      queryConfig.where_type = uniqueType;
      queryConfig.where_fields = [];
      if (uniqueType === 'or' && this.moduleAPI === 'update') {
        queryConfig.where_type = 'raw';
        const whereClauses = [];
        const whereBindings = {};
        Object.keys(uniqueFields).forEach((key) => {
          const whereKey = uniqueFields[key];
          const whereVal = inputParams[key];
          if (is_empty == 'Yes') {
            whereClauses.push(`(${whereKey} = :${whereKey} AND :${whereKey} != '')`);
          } else {
            whereClauses.push(`${whereKey} = :${whereKey}`);
          }
          whereBindings[whereKey] = whereVal;
        });
        const primaryKey = this.serviceConfig.primary_key;
        const primaryVal = inputParams.id;
        whereBindings[primaryKey] = primaryVal;
        const whereCondition = `(${whereClauses.join(
          ' OR ',
        )}) AND ${primaryKey} <> :${primaryKey}`;
        console.log(whereCondition)
        queryConfig.where_condition = whereCondition;
        queryConfig.where_bindings = whereBindings;
      } else {
        Object.keys(uniqueFields).forEach((key) => {
          if (typeof inputParams[key] != 'undefined' && inputParams[key] != '') {
            queryConfig.where_fields.push({
              field: uniqueFields[key],
              value: inputParams[key],
              oper: 'eq',
            });
          }
        });
        if (this.moduleAPI === 'update') {
          queryConfig.where_fields.push({
            field: this.serviceConfig.primary_key,
            value: inputParams.id,
            oper: 'ne',
          });
        }
      }
      const queryResult = await this.executeSelect(queryConfig);
      if (_.isArray(queryResult.data) && queryResult.data.length > 0) {
        if (queryResult.data[0].numrows > 0) {
          uniqueStatus = 1;
          uniqueMessage = this.serviceConfig.unique_fields?.message;
        }
      }
    }

    return {
      unique_status: uniqueStatus,
      unique_message: uniqueMessage,
    };
  }
}