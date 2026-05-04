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
import { BedsEntity } from '../entities/beds.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class BedsService {
  protected readonly log = new LoggerHandler(BedsService.name).getInstance();
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

  async startBeds(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getBeds(this.inputParams);
      if (!_.isEmpty(this.inputParams.beds)) {
        outputResponse = this.bedsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.bedsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> beds >>', err);
    }
    return outputResponse;
  }

  async getBeds(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(BedsEntity)
        .createQueryBuilder('b')
        .leftJoin('rooms', 'r', 'r.room_id = b.room_id')
        .leftJoin('floors', 'f', 'f.floor_id = r.floor_id')
        .leftJoin('hostels', 'h', 'h.hostel_id = r.hostel_id')
        .select('b.*')
        .addSelect('r.room_number', 'room_number')
        .addSelect('f.floor_number', 'floor_number')
        .addSelect('h.hostel_name', 'hostel_name');

      if ('room_id' in inputParams) {
        query.where('b.room_id = :room', { room: inputParams.room_id });
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

    inputParams.beds = this.blockResult.data;
    
    return inputParams;
  }

  bedsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Beds found.'),
      fields: [
        'bed_id',
        'room_id',
        'room_number',
        'floor_number',
        'hostel_name',
        'bed_number',
        'status',
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
      name: 'beds',
      multiple_keys: this.multipleKeys,
      output_keys: ['beds'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startBedDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getBedDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.bed_details)) {
        outputResponse = this.bedDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.bedsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> bed_details >>', err);
    }
    return outputResponse;
  }

  async getBedDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(BedsEntity)
        .createQueryBuilder('b')
        .leftJoin('rooms', 'r', 'r.room_id = b.room_id')
        .leftJoin('floors', 'f', 'f.floor_id = r.floor_id')
        .leftJoin('hostels', 'h', 'h.hostel_id = r.hostel_id')
        .select('b.*')
        .addSelect('r.room_number', 'room_number')
        .addSelect('f.floor_number', 'floor_number')
        .addSelect('h.hostel_name', 'hostel_name');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('b.bed_id = :bid', { bid: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.bed_details = this.blockResult.data;
    
    return inputParams;
  }

  bedDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Bed details found.'),
      fields: [
        'bed_id',
        'room_id',
        'room_number',
        'floor_number',
        'hostel_name',
        'bed_number',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'bed_details',
      single_keys: ['bed_details'],
      output_keys: ['bed_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  bedsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Beds not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'beds' },
    );
  }
}
