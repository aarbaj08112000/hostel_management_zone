// src/services/floors-add.service.ts
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
import { FloorsEntity } from '../entities/floors.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class FloorsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    FloorsAddService.name,
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
  @InjectRepository(FloorsEntity) protected floorRepo: Repository<FloorsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_floor_data', 'update_floor_data'];
    this.moduleName = 'floor';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'floor',
      table_name: 'floors',
      table_alias: 'f',
      primary_key: 'floorId',
      primary_alias: 'f_floor_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startFloorAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;
      inputParams = await this.insertFloorData(inputParams);
      if (!_.isEmpty(inputParams.insert_floor_data))
        outputResponse = await this.floorFinishSuccess(
          inputParams,
          'Floor Added Successfully.',
        );
      else outputResponse = await this.floorFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> floor_add >>', err);
    }
    return outputResponse;
  }

  async insertFloorData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_id' in inputParams)
        queryColumns.hostel_id = inputParams.hostel_id;
      if ('floor_number' in inputParams)
        queryColumns.floor_number = inputParams.floor_number;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';

      const res = await this.floorRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Floor Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_floor_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startFloorUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;
      inputParams = await this.updateFloorData(inputParams);
      if (!_.isEmpty(inputParams.update_floor_data))
        outputResponse = await this.floorFinishSuccess(
          inputParams,
          'Floor Updated Successfully.',
        );
      else outputResponse = await this.floorFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> floor_update >>', err);
    }
    return outputResponse;
  }

  async updateFloorData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('floor_number' in inputParams)
        queryColumns.floor_number = inputParams.floor_number;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.floorRepo
        .createQueryBuilder()
        .update(FloorsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('floor_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Floor Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_floor_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteFloor(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteFloorData(id);
      if (inputParams.deleted_floor)
        outputResponse = await this.floorFinishSuccess(
          inputParams,
          inputParams.message,
        );
      else outputResponse = await this.floorFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> floor_delete >>', err);
    }
    return outputResponse;
  }

  async deleteFloorData(id: any) {
    try {
      const deleteResult = await this.floorRepo.delete({ floor_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Floor found.' };
      return {
        success: 1,
        message: 'Floor Deleted Successfully.',
        deleted_floor: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async floorFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_floor_data'],
        },
        data: inputParams,
      },
      { name: 'floor_add', single_keys: this.singleKeys },
    );
  }

  async floorFinishFailure(inputParams: any) {
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
      { name: 'floor_add' },
    );
  }
}
