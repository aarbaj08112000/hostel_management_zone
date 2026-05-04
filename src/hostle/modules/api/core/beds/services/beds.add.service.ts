// src/services/beds-add.service.ts
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
import { BedsEntity } from '../entities/beds.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class BedsAddService extends BaseService {
  protected readonly log = new LoggerHandler(BedsAddService.name).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(BedsEntity) protected bedRepo: Repository<BedsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_bed_data', 'update_bed_data'];
    this.moduleName = 'bed';
    this.serviceConfig = {
      module_name: 'bed',
      table_name: 'beds',
      table_alias: 'b',
      primary_key: 'bedId',
      primary_alias: 'b_bed_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startBedAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertBedData(reqParams);
      return !_.isEmpty(inputParams.insert_bed_data)
        ? await this.bedFinishSuccess(inputParams, 'Bed Added Successfully.')
        : await this.bedFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> bed_add >>', err);
      return {};
    }
  }

  async insertBedData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      ['room_id', 'bed_number', 'status', 'added_by'].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      queryColumns.added_date = () => 'NOW()';
      const res = await this.bedRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Bed Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_bed_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startBedUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updateBedData(reqParams);
      return !_.isEmpty(inputParams.update_bed_data)
        ? await this.bedFinishSuccess(inputParams, 'Bed Updated Successfully.')
        : await this.bedFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> bed_update >>', err);
      return {};
    }
  }

  async updateBedData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      ['room_id', 'bed_number', 'status', 'updated_by'].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.bedRepo
        .createQueryBuilder()
        .update(BedsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('bedId = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Bed Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_bed_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteBed(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteBedData(id);
      return inputParams.deleted_bed
        ? await this.bedFinishSuccess(inputParams, inputParams.message)
        : await this.bedFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> bed_delete >>', err);
      return {};
    }
  }

  async deleteBedData(id: any) {
    try {
      const deleteResult = await this.bedRepo.delete({ bed_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Bed found.' };
      return {
        success: 1,
        message: 'Bed Deleted Successfully.',
        deleted_bed: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async bedFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_bed_data'],
        },
        data: inputParams,
      },
      { name: 'bed_add', single_keys: this.singleKeys },
    );
  }
  async bedFinishFailure(inputParams: any) {
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
      { name: 'bed_add' },
    );
  }
}
