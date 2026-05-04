// src/services/stays-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { StaysEntity } from '../entities/stays.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class StaysAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    StaysAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(StaysEntity) protected stayRepo: Repository<StaysEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_stay_data', 'update_stay_data'];
    this.moduleName = 'stay';
    this.serviceConfig = {
      module_name: 'stay',
      table_name: 'stays',
      table_alias: 's',
      primary_key: 'stayId',
      primary_alias: 's_stay_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startStayAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertStayData(reqParams);
      return !_.isEmpty(inputParams.insert_stay_data)
        ? await this.stayFinishSuccess(inputParams, 'Stay Added Successfully.')
        : await this.stayFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> stay_add >>', err);
      return {};
    }
  }

  async insertStayData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'bed_id',
        'check_in_date',
        'check_out_date',
        'status',
        'added_by',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      queryColumns.added_date = () => 'NOW()';
      const res = await this.stayRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Stay Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_stay_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startStayUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updateStayData(reqParams);
      return !_.isEmpty(inputParams.update_stay_data)
        ? await this.stayFinishSuccess(
            inputParams,
            'Stay Updated Successfully.',
          )
        : await this.stayFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> stay_update >>', err);
      return {};
    }
  }

  async updateStayData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'bed_id',
        'check_in_date',
        'check_out_date',
        'status',
        'updated_by',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.stayRepo
        .createQueryBuilder()
        .update(StaysEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('stayId = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Stay Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_stay_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteStay(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteStayData(id);
      return inputParams.deleted_stay
        ? await this.stayFinishSuccess(inputParams, inputParams.message)
        : await this.stayFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> stay_delete >>', err);
      return {};
    }
  }

  async deleteStayData(id: any) {
    try {
      const deleteResult = await this.stayRepo.delete({ stay_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Stay found.' };
      return {
        success: 1,
        message: 'Stay Deleted Successfully.',
        deleted_stay: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async stayFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_stay_data'],
        },
        data: inputParams,
      },
      { name: 'stay_add', single_keys: this.singleKeys },
    );
  }
  async stayFinishFailure(inputParams: any) {
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
      { name: 'stay_add' },
    );
  }
}
