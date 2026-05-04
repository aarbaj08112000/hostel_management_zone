// src/services/electricity-readings.service.ts
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
import { BaseService } from '@repo/source/services/base.service';
import { ElectricityReadingsEntity } from '../entities/electricity_readings.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class ElectricityAddReadingsService extends BaseService {
  protected readonly log = new LoggerHandler(
    ElectricityAddReadingsService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(ElectricityReadingsEntity)
  protected repo: Repository<ElectricityReadingsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_reading_data', 'update_reading_data'];
    this.moduleName = 'electricity_readings';
    this.serviceConfig = {
      module_name: 'electricity_readings',
      table_name: 'electricity_readings',
      table_alias: 'er',
      primary_key: 'reading_id',
      primary_alias: 'er_reading_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      const inputParams = await this.insertData(reqParams);
      if (!_.isEmpty(inputParams.insert_reading_data)) {
        outputResponse = await this.finishSuccess(
          inputParams,
          'Reading Added Successfully.',
        );
      } else {
        outputResponse = await this.finishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> readings_add >>', err);
    }
    return outputResponse;
  }

  async insertData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'room_id',
        'reading_date',
        'units_consumed',
        'rate_per_unit',
        'total_amount',
      ].forEach((field) => {
        if (field in inputParams) queryColumns[field] = inputParams[field];
      });
      const res = await this.repo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Reading Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err, data: [] };
    }
    inputParams.insert_reading_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }

  async startUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      const inputParams = await this.updateData(reqParams);
      if (!_.isEmpty(inputParams.update_reading_data)) {
        outputResponse = await this.finishSuccess(
          inputParams,
          'Reading Updated Successfully.',
        );
      } else {
        outputResponse = await this.finishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> readings_update >>', err);
    }
    return outputResponse;
  }

  async updateData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'room_id',
        'reading_date',
        'units_consumed',
        'rate_per_unit',
        'total_amount',
        'updated_by',
      ].forEach((field) => {
        if (field in inputParams) queryColumns[field] = inputParams[field];
      });
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.repo
        .createQueryBuilder()
        .update()
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('reading_id = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Reading Updated.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err, data: [] };
    }
    inputParams.update_reading_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }

  async delete(id: any) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteData(id);
      if (inputParams.deleted_reading) {
        outputResponse = await this.finishSuccess(
          inputParams,
          inputParams.message,
        );
      } else {
        outputResponse = await this.finishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> readings_delete >>', err);
    }
    return outputResponse;
  }

  async deleteData(id: any) {
    try {
      const deleteResult = await this.repo.delete({ reading_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Reading found.' };
      return {
        success: 1,
        message: 'Reading Deleted Successfully.',
        deleted_reading: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async finishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_id', 'insert_reading_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      {
        name: 'readings_add',
        output_keys: ['insert_reading_data'],
        output_alias: { insert_id: 'id' },
        single_keys: this.singleKeys,
      },
    );
  }

  async finishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'readings_add' },
    );
  }
}
