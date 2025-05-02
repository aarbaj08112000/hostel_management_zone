import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { DataSource, Repository, In } from 'typeorm';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CarTagsEntity } from '../entities/car-tag.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as _ from 'lodash';
import { CarEntity } from '../entities/cars.entity';
interface AuthObject {
  user: any;
}

@Injectable()
export class CarTagAddService extends BaseService {
  protected readonly log = new LoggerHandler(CarTagAddService.name).getInstance();
  protected inputParams: object = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly response: ResponseLibrary;

  @InjectRepository(CarTagsEntity)
  protected carTagRepo: Repository<CarTagsEntity>;
  
  @InjectRepository(CarEntity)
  protected carEntity : Repository<CarEntity>;

  constructor() {
    super();
    this.moduleName = 'car_tag';
    this.moduleAPI = '';
  }


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

  async updateCarTags(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');

      const inputParams = await this.updateCarTagData(reqParams);
      if (!_.isEmpty(inputParams.updated_car_tags)) {
        outputResponse = this.tagFinishSuccess(inputParams, 'update');
      } else {
        outputResponse = this.tagFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_tag_update >>', err);
    }
    return outputResponse;
  }

  async insertCarTags(inputParams: any) {
    try {
      this.moduleAPI = 'add';
      const { tag_id, car_ids, added_by } = inputParams;
      const addedDate = () => 'NOW()';
      const insertData = car_ids.map((carId) => ({
        tagId: tag_id,
        carId,
        addedDate: addedDate,
        addedBy: added_by
      }));
      await this.carTagRepo.insert(insertData);

      return {
        success: 1,
        message: 'Car(s) added successfully.',
        inserted_car_tags: insertData,
      };
    } catch (err) {
      return { success: 0, message: err, inserted_car_tags: [] };
    }
  }
  async DeleteCarTags(id) {
    let outputResponse = {};

    try {
      this.moduleAPI = 'delete';
      this.setModuleAPI('update');
      const inputParams = await this.deleteCarTagData(id);

      if (inputParams.deleted_car_tag) {
        outputResponse = this.tagFinishSuccess(inputParams, 'update');
      } else {
        outputResponse = this.tagFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_tag_update >>', err);
    }
    return outputResponse;
  }

  async deleteCarTagData(id: any) {
    try {
      let carTagId = id;
      const deleteResult = await this.carTagRepo.delete({ carTagId });

      if (deleteResult.affected === 0) {
        return { success: 0, message: 'No Badge found for the given ID.' };
      }

      return {
        success: 1,
        message: 'Car(s) deleted successfully.',
        deleted_car_tag: deleteResult.affected
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async updateCarTagData(inputParams: any) {
    try {
      const { car_ids, tag_id, updated_by } = inputParams;
      const updatedDate = () => 'NOW()';
      this.moduleAPI = 'update';
      const existingTags = await this.carTagRepo.find({ where: { tagId: tag_id } });
      const existingTagIds = existingTags.map((tag) => tag.carId);
      const newTagIds = car_ids.filter((id) => !existingTagIds.includes(id));
      const removeTagIds = existingTagIds.filter((id) => !car_ids.includes(id));
      if (removeTagIds.length > 0) {
        await this.carTagRepo.delete({
          tagId: tag_id,
          carId: In(removeTagIds),
        });
      }


      if (newTagIds.length > 0) {
        const insertData = newTagIds.map((carId) => ({
          tagId: tag_id,
          carId,
          updatedBy: updated_by,
          updatedDate: updatedDate
        }));
        await this.carTagRepo.insert(insertData);
      }

      return {
        success: 1,
        message: 'Car(s) updated successfully.',
        updated_car_tags: { tag_id :tag_id, added: newTagIds, removed: removeTagIds },
      };
    } catch (err) {
      console.log(err)
      return { success: 0, message: err, updated_car_tags: [] };
    }
  }


  async tagFinishSuccess(inputParams: any, type: string) {
    let tag_id = inputParams?.updated_car_tags?.tag_id ?? inputParams.inserted_car_tags[0]['tagId']
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'tag_car_list',
        data: tag_id
      },
    };
    await this.general.submitGearmanJob(job_data);
    let car_ids = inputParams.inserted_car_tags?.map((data) => data.carId) || [];
    if (inputParams.updated_car_tags?.added?.length) {
      car_ids.push(...inputParams.updated_car_tags.added);
    }

    if (inputParams.updated_car_tags?.removed?.length) {
      car_ids = car_ids.filter(id => !inputParams.updated_car_tags.removed.includes(id));
    }
    
    if(car_ids.length > 0){
      let car_job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'car_list',
          data: car_ids
        },
      };
      await this.general.submitGearmanJob(car_job_data);
    }
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message: inputParams.message,
          // type === 'update'
          //   ? 'Car Tags Updated Successfully.'
          //   : 'Car Tags Added Successfully.',
          fields: ['inserted_car_tags', 'updated_car_tags', 'deleted_car_tag'],
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
