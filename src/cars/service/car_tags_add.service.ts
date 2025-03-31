import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { DataSource, Repository, In } from 'typeorm';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CarTagsEntity } from '../entities/car-tag.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class CarTagsAddService extends BaseService {
  protected readonly log = new LoggerHandler(CarTagsAddService.name).getInstance();
  protected inputParams: object = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly response: ResponseLibrary;

  @InjectRepository(CarTagsEntity)
  protected carTagRepo: Repository<CarTagsEntity>;

  constructor() {
    super();
    this.moduleName = 'car_tag';
    this.moduleAPI = '';
  }

  // ============ ADD CAR TAGS ============
  async addCarTags(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      const inputParams = await this.insertCarTags(reqParams);
      if (!_.isEmpty(inputParams.inserted_car_tags)) {
        outputResponse = this.tagFinishSuccess(inputParams, '');
      } else {
        outputResponse = this.tagFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_tag_add >>', err);
    }
    return outputResponse;
  }

  // ============ INSERT CAR TAGS ============
  async insertCarTags(inputParams: any) {
    try {
      const { car_id, tag_ids, added_by } = inputParams;

      // Delete existing tags for the car (regardless of whether tag_ids is empty or not)
      await this.carTagRepo.delete({ carId: car_id });

      // If tag_ids are empty, return success after deletion
      if (_.isEmpty(tag_ids)) {
        return {
          success: 1,
          message: 'Car badge(s) updated successfully.',
          inserted_car_tags: 'successs',
        };
      }

      // Prepare the new tags to be inserted
      const insertData = tag_ids.map(tag_id => ({
        carId: car_id,
        tagId: tag_id,
        addedBy: added_by,
        addedDate: () => 'NOW()',
      }));

      // Insert new tags
      await this.carTagRepo.insert(insertData);

      return {
        success: 1,
        message: 'Car badge(s) added successfully.',
        inserted_car_tags: insertData,
      };
    } catch (err) {
      console.error('Error inserting car tags:', err);
      return { success: 0, message: 'Failed to add car tags', inserted_car_tags: [] };
    }
  }


  // ============ RESPONSE HANDLING ============
  tagFinishSuccess(inputParams: any, type: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'tag_list',
      },
    };
    this.general.submitGearmanJob(job_data);
    let car_job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
      },
    };
    this.general.submitGearmanJob(car_job_data);
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message: inputParams.message || 'Car badge(s) added successfully.',
          fields: ['inserted_car_tags'],
        },
        data: inputParams,
      },
      { name: 'car_tag_add' },
    );
  }

  tagFinishFailure(inputParams: any) {
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
      { name: 'car_tag_add' },
    );
  }
}
