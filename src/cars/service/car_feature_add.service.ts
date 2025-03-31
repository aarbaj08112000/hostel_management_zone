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
      if (!_.isEmpty(inputParams.inserted_car_features)) {
        outputResponse = this.featureFinishSuccess(inputParams, '');
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
      if (!_.isEmpty(inputParams.updated_car_features)) {
        outputResponse = this.featureFinishSuccess(inputParams, 'update');
      } else {
        outputResponse = this.featureFinishFailure(inputParams);
      }
    } catch (err) {
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

      // Extract feature IDs from input
      const newFeatureIds = feature_ids.map(obj => Object.keys(obj)[0]).filter(key => key !== "");

      // Get existing feature IDs for the car
      const existingFeatures = await this.carFeatureRepo.find({ where: { carId: car_id } });
      const existingFeatureIds = existingFeatures.map((feature) => feature.featureId);
      if (typeof feature_ids != 'undefined' && feature_ids.length > 0) {
        let temp = feature_ids.map(obj => obj.feature_id);
        const newFeatureIds = temp.filter((id) => !existingFeatureIds.includes(id));
        const removeFeatureIds = existingFeatureIds.filter((id) => !feature_ids.includes(id));

        // Delete removed features
        if (removeFeatureIds.length > 0) {
          await this.carFeatureRepo.delete({
            carId: car_id,
            featureId: In(removeFeatureIds),
          });
        }

        // // Insert new features
        if (newFeatureIds.length > 0) {
          this.insertCarFeatures(inputParams)
        }
        return {
          success: 1,
          message: 'Car Features updated successfully.',
          updated_car_features: { added: newFeatureIds, removed: removeFeatureIds },
        };
      } else {
        await this.carFeatureRepo.delete({ carId: car_id });
        return {
          success: 1,
          message: 'Nothing to Update',
          updated_car_features: { car_id: car_id }
        }
      }
    } catch (err) {
      console.error('Error updating car features:', err);
      return { success: 0, message: 'Failed to update car features', error: err };
    }
  }

  // ============ RESPONSE HANDLING ============
  featureFinishSuccess(inputParams: any, type: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_features',
      },
    };
    this.general.submitGearmanJob(job_data);
    job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
      },
    };
    this.general.submitGearmanJob(job_data);
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
