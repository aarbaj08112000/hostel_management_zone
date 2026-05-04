// src/services/amenities-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { AmenitiesEntity } from '../entities/amenities.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class AmenitiesAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    AmenitiesAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(AmenitiesEntity)
  protected amenityRepo: Repository<AmenitiesEntity>;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_amenity_data',
      'update_amenity_data',
    ];
    this.moduleName = 'amenity';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'amenity',
      table_name: 'amenities',
      table_alias: 'a',
      primary_key: 'amenity_id',
      primary_alias: 'a_amenity_id',
      unique_fields: {
        type: 'and',
        fields: { amenity_code: 'amenity_code' },
        message: 'Record already exists with this Amenity Code',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  /** Start Add Amenity */
  async startAmenityAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');

      let inputParams = reqParams;
      inputParams = await this.customUniqueCondition(inputParams);

      if (inputParams.unique_status === 1)
        outputResponse = await this.amenityFinishFailure(inputParams);
      else {
        inputParams = await this.insertAmenityData(inputParams);
        if (!_.isEmpty(inputParams.insert_amenity_data))
          outputResponse = await this.amenityFinishSuccess(
            inputParams,
            'Amenity Added Successfully.',
          );
        else outputResponse = await this.amenityFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> amenity_add >>', err);
    }
    return outputResponse;
  }

  /** Insert Amenity Data */
  async insertAmenityData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('amenity_name' in inputParams)
        queryColumns.amenity_name = inputParams.amenity_name;
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      if ('amenity_code' in inputParams)
        queryColumns.amenity_code = inputParams.amenity_code;
      if ('added_by' in inputParams)
        queryColumns.added_by = inputParams.added_by;
      queryColumns.added_date = () => 'NOW()';
      const res = await this.amenityRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId };
      this.blockResult = {
        success: 1,
        message: 'Amenity Added Successfully.',
        data,
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_amenity_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  /** Start Update Amenity */
  async startAmenityUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;
      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1)
        outputResponse = await this.amenityFinishFailure(inputParams);
      else {
        inputParams = await this.updateAmenityData(inputParams);
        if (!_.isEmpty(inputParams.update_amenity_data))
          outputResponse = await this.amenityFinishSuccess(
            inputParams,
            'Amenity Updated Successfully.',
          );
        else outputResponse = await this.amenityFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> amenity_update >>', err);
    }
    return outputResponse;
  }

  /** Update Amenity Data */
  async updateAmenityData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('amenity_name' in inputParams)
        queryColumns.amenity_name = inputParams.amenity_name;
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      if ('amenity_code' in inputParams)
        queryColumns.amenity_code = inputParams.amenity_code;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = inputParams.updated_by;
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.amenityRepo
        .createQueryBuilder()
        .update(AmenitiesEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('amenity_id = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Amenity Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_amenity_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  /** Delete Amenity */
  async DeleteAmenity(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteAmenityData(id);
      if (inputParams.deleted_amenity)
        outputResponse = await this.amenityFinishSuccess(
          inputParams,
          inputParams.message,
        );
      else outputResponse = await this.amenityFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> amenity_delete >>', err);
    }
    return outputResponse;
  }

  /** Delete Amenity Data */
  async deleteAmenityData(id: any) {
    try {
      const deleteResult = await this.amenityRepo.delete({ amenity_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Amenity found.' };
      return {
        success: 1,
        message: 'Amenity Deleted Successfully.',
        deleted_amenity: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  /** Custom Unique */
  async customUniqueCondition(inputParams: any) {
    try {
      const result = await this.checkUniqueCondition(inputParams);
      const formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;
      return this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
      return inputParams;
    }
  }

  /** Finish Success / Failure */
  async amenityFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_amenity_data'],
        },
        data: inputParams,
      },
      { name: 'amenity_add', single_keys: this.singleKeys },
    );
  }

  async amenityFinishFailure(inputParams: any) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: custom.lang('Something went wrong, Please try again.'),
          fields: [],
        },
        data: inputParams,
      },
      { name: 'amenity_add' },
    );
  }
}
