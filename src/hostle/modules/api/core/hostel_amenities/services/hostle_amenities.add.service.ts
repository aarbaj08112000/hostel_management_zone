// src/services/hostel-amenities-add.service.ts
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
import { HostelAmenitiesEntity } from '../entities/hostel_amenities.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class HostelAmenitiesAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    HostelAmenitiesAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(HostelAmenitiesEntity)
  protected hostelAmenityRepo: Repository<HostelAmenitiesEntity>;

  constructor() {
    super();
    this.singleKeys = [
      'insert_hostel_amenity_data',
      'update_hostel_amenity_data',
    ];
    this.moduleName = 'hostel_amenity';
    this.serviceConfig = {
      module_name: 'hostel_amenity',
      table_name: 'hostel_amenities',
      table_alias: 'ha',
      primary_key: 'hostelAmenityId',
      primary_alias: 'ha_hostel_amenity_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startHostelAmenityAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertHostelAmenityData(reqParams);
      return !_.isEmpty(inputParams.insert_hostel_amenity_data)
        ? await this.hostelAmenityFinishSuccess(
            inputParams,
            'Hostel Amenity Added Successfully.',
          )
        : await this.hostelAmenityFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> hostel_amenity_add >>', err);
      return {};
    }
  }

  async insertHostelAmenityData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_id' in inputParams)
        queryColumns.hostel_id = inputParams.hostel_id;
      if ('amenity_id' in inputParams)
        queryColumns.amenity_id = inputParams.amenity_id;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.hostelAmenityRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Hostel Amenity Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_hostel_amenity_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startHostelAmenityUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updateHostelAmenityData(reqParams);
      return !_.isEmpty(inputParams.update_hostel_amenity_data)
        ? await this.hostelAmenityFinishSuccess(
            inputParams,
            'Hostel Amenity Updated Successfully.',
          )
        : await this.hostelAmenityFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> hostel_amenity_update >>', err);
      return {};
    }
  }

  async updateHostelAmenityData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_id' in inputParams)
        queryColumns.hostel_id = inputParams.hostel_id;
      if ('amenity_id' in inputParams)
        queryColumns.amenity_id = inputParams.amenity_id;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.hostelAmenityRepo
        .createQueryBuilder()
        .update(HostelAmenitiesEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('hostelAmenityId = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Hostel Amenity Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_hostel_amenity_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteHostelAmenity(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteHostelAmenityData(id);
      return inputParams.deleted_hostel_amenity
        ? await this.hostelAmenityFinishSuccess(
            inputParams,
            inputParams.message,
          )
        : await this.hostelAmenityFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> hostel_amenity_delete >>', err);
      return {};
    }
  }

  async deleteHostelAmenityData(id: any) {
    try {
      const deleteResult = await this.hostelAmenityRepo.delete({
        hostel_amenity_id: id,
      });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Hostel Amenity found.' };
      return {
        success: 1,
        message: 'Hostel Amenity Deleted Successfully.',
        deleted_hostel_amenity: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async hostelAmenityFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_hostel_amenity_data'],
        },
        data: inputParams,
      },
      { name: 'hostel_amenity_add', single_keys: this.singleKeys },
    );
  }
  async hostelAmenityFinishFailure(inputParams: any) {
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
      { name: 'hostel_amenity_add' },
    );
  }
}
