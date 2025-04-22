import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { DataSource, Repository, In } from 'typeorm';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CarFeatureEntity } from '../entities/cars.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class CarFeatureAddService extends BaseService {
  protected readonly log = new LoggerHandler(CarFeatureAddService.name).getInstance();
  protected inputParams: object = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly response: ResponseLibrary;

  @InjectRepository(CarFeatureEntity)
  protected carFeatureRepo: Repository<CarFeatureEntity>;

  constructor() {
    super();
    this.moduleName = 'car_feature';
    this.moduleAPI = '';
  }

  // ============ ADD CAR FEATURES ============
  async addCarFeatures(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      const inputParams = await this.insertCarFeatures(reqParams);
      let car_id = reqParams.car_id;
      let car_name = reqParams.car_id;
      let added_by = reqParams.added_by;
      if (!_.isEmpty(inputParams.inserted_car_features)) {
        outputResponse = this.featureFinishSuccess(inputParams, '');

        let value_json = {
          "CAR_NAME": car_name,
          "CAR_ID": car_id,
          "ADDED_BY": await this.general.getAdminName(added_by),
          "ADDED_BY_ID": added_by
        }
        await this.general.addActivity(this.moduleName, this.moduleAPI, added_by, value_json, car_id);
      } else {
        outputResponse = this.featureFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_feature_add >>', err);
    }
    return outputResponse;
  }

  // ============ UPDATE CAR FEATURES ============
  async updateCarFeatures(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');

      const inputParams = await this.updateCarFeatureData(reqParams);
      let car_id = inputParams.car_id;
      let car_name = inputParams.car_id;
      let updated_by = 0;
      if (!_.isEmpty(inputParams.updated_car_features)) {
        outputResponse = this.featureFinishSuccess(inputParams, 'update');
        let value_json = {
          "CAR_NAME": car_name,
          "CAR_ID": car_id,
          "UPDATED_BY": await this.general.getAdminName(updated_by),
          "UPDATED_BY_ID": updated_by
        }

        await this.general.addActivity(this.moduleName, this.moduleAPI, updated_by, value_json, car_id);
      } else {
        outputResponse = this.featureFinishFailure(inputParams);
      }
    } catch (err) {
      console.log(err)
      this.log.error('API Error >> car_feature_update >>', err);
    }
    return outputResponse;
  }

  // ============ INSERT CAR FEATURES ============
  async insertCarFeatures(inputParams: any) {
    try {

      let insertData
      const { car_id, feature_ids, added_by } = inputParams; // feature_ids = [101, 102, 103]
      if ('updated_by' in inputParams) inputParams.added_by = inputParams.updated_by;
      const addedDate = () => 'NOW()';
      const temp = Object.entries(feature_ids).filter(([key, value]) => Object.keys(value)[0]).map(([key, value]) => ({
        carId: car_id,
        addedBy: added_by,
        addedDate: addedDate,
        featureId: value['feature_id'],
        featureValue: value['value'] ? value['value'] : ''
      }));
      insertData = temp;
      await this.carFeatureRepo.insert(insertData);

      return {
        success: 1,
        message: 'Car Features added successfully.',
        inserted_car_features: insertData,
      };
    } catch (err) {
      console.log(err)
      return { success: 0, message: err, inserted_car_features: [] };
    }
  }

  // ============ UPDATE CAR FEATURES ============
  async updateCarFeatureData(inputParams: any) {
    try {
      const { car_id, feature_ids } = inputParams;

      const newFeatureIds = feature_ids
        .map(obj => obj.feature_id)
        .filter(id => id !== undefined && id !== null);

      await this.carFeatureRepo.delete({ carId: car_id });

      if (newFeatureIds.length > 0) {
        await this.insertCarFeatures(inputParams);
      }

      return {
        success: 1,
        message: 'Car Features updated successfully.',
        updated_car_features: { added: newFeatureIds },
        car_id: car_id
      };
    } catch (err) {
      console.error('Error updating car features:', err);
      return { success: 0, message: 'Failed to update car features', error: err };
    }
  }

  // ============ RESPONSE HANDLING ============
  async featureFinishSuccess(inputParams: any, type: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_features',
        data: ''
      },
    };
    await this.general.submitGearmanJob(job_data);
    job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
        data: inputParams.car_id
      },
    };
    await this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message:
            type === 'update'
              ? 'Car Features updated successfully.'
              : 'Car Features added successfully.',
          fields: ['inserted_car_features', 'updated_car_features'],
        },
        data: inputParams,
      },
      { name: 'car_feature_add' },
    );
  }

  featureFinishFailure(inputParams: any) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: 'Something went wrong, Please try again.',
          fields: [],
        },
        data: inputParams,
      },
      { name: 'car_feature_add' },
    );
  }
}
