import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FloorsEntity } from '../entities/floors.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class FloorsService {
  protected readonly log = new LoggerHandler(FloorsService.name).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;

  constructor(protected readonly elasticService: ElasticService) { }

  async startFloors(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getFloors(this.inputParams);
      if (!_.isEmpty(this.inputParams.floors)) {
        outputResponse = this.floorsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.floorsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> floors >>', err);
    }
    return outputResponse;
  }

  async getFloors(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(FloorsEntity)
        .createQueryBuilder('f')
        .leftJoin('hostels', 'h', 'h.hostel_id = f.hostel_id')
        .select('f.*')
        .addSelect('h.hostel_name', 'hostel_name');

      if ('hostel_id' in inputParams) {
        query.where('f.hostel_id = :hid', { hid: inputParams.hostel_id });
      }

      if ('floor_number' in inputParams) {
        query.andWhere('f.floor_number = :fnum', {
          fnum: inputParams.floor_number,
        });
      }

      
      const count = await query.getCount();
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const data = await query.getRawMany();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.floors = this.blockResult.data;
    
    return inputParams;
  }

  floorsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Floors found.'),
      fields: [
        'floor_id',
        'hostel_id',
        'hostel_name',
        'floor_number',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'floors',
      multiple_keys: this.multipleKeys,
      output_keys: ['floors'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startFloorDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getFloorDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.floor_details)) {
        outputResponse = this.floorDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.floorsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> floor_details >>', err);
    }
    return outputResponse;
  }

  async getFloorDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(FloorsEntity)
        .createQueryBuilder('f')
        .leftJoin('hostels', 'h', 'h.hostel_id = f.hostel_id')
        .select('f.*')
        .addSelect('h.hostel_name', 'hostel_name');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('f.floor_id = :fid', { fid: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getRawOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.floor_details = this.blockResult.data;
    
    return inputParams;
  }

  floorDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Floor details found.'),
      fields: [
        'floor_id',
        'hostel_id',
        'hostel_name',
        'floor_number',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'floor_details',
      single_keys: ['floor_details'],
      output_keys: ['floor_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  floorsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Floors not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'floors' },
    );
  }
}
