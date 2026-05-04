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
import { HostelsEntity } from '../entities/hostels.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class HostelsService {
  protected readonly log = new LoggerHandler(HostelsService.name).getInstance();
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

  async startHostels(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getHostels(this.inputParams);
      if (!_.isEmpty(this.inputParams.hostels)) {
        outputResponse = this.hostelsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.hostelsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostels >>', err);
    }
    return outputResponse;
  }

  async getHostels(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(HostelsEntity)
        .createQueryBuilder('h');
        console.log(query)
        console.log(inputParams)
      this.moduleService.getListFilterClause(query, inputParams, {});
      if ('hostel_id' in inputParams) {
        query.where('h.hostel_id = :hid', { hid: inputParams.hostel_id });
      }

      if ('city' in inputParams) {
        query.andWhere('h.city = :city', { city: inputParams.city });
      }
      console.log(query)
      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      console.log(err)
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.hostels = this.blockResult.data;
    
    return inputParams;
  }

  hostelsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Hostels found.'),
      fields: [
        'hostel_id',
        'hostel_name',
        'address',
        'city',
        'state',
        'pincode',
        'contact_number',
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
      name: 'hostels',
      multiple_keys: this.multipleKeys,
      output_keys: ['hostels'],
    };
    return this.response.outputResponse(outputData, funcData);
  }

  async startHostelDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getHostelDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.hostel_details)) {
        outputResponse = this.hostelDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.hostelsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostel_details >>', err);
    }
    return outputResponse;
  }

  async getHostelDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(HostelsEntity)
        .createQueryBuilder('h');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('h.hostel_id = :hid', { hid: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.hostel_details = this.blockResult.data;
    
    return inputParams;
  }

  hostelDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Hostel details found.'),
      fields: [
        'hostel_id',
        'hostel_name',
        'address',
        'city',
        'state',
        'pincode',
        'contact_number',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'hostel_details',
      single_keys: ['hostel_details'],
      output_keys: ['hostel_details'],
    };
    return this.response.outputResponse(outputData, funcData);
  }

  hostelsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Hostels not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'hostels' },
    );
  }
}
