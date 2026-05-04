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
import { HostelAmenitiesEntity } from '../entities/hostel_amenities.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class HostelAmenitiesService {
  protected readonly log = new LoggerHandler(
    HostelAmenitiesService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;

  constructor(protected readonly elasticService: ElasticService) {}

  async startHostelAmenities(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getHostelAmenities(this.inputParams);
      if (!_.isEmpty(this.inputParams.hostel_amenities)) {
        outputResponse = this.hostelAmenitiesFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.hostelAmenitiesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostel_amenities >>', err);
    }
    return outputResponse;
  }

  async getHostelAmenities(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(HostelAmenitiesEntity)
        .createQueryBuilder('ha');

      if ('hostel_id' in inputParams) {
        query.where('ha.hostel_id = :hid', { hid: inputParams.hostel_id });
      }

      if ('amenity_id' in inputParams) {
        query.andWhere('ha.amenity_id = :aid', { aid: inputParams.amenity_id });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.hostel_amenities = this.blockResult.data;
    
    return inputParams;
  }

  hostelAmenitiesFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Hostel amenities found.'),
      fields: ['hostel_amenity_id', 'hostel_id', 'amenity_id'],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'hostel_amenities',
      multiple_keys: this.multipleKeys,
      output_keys: ['hostel_amenities'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startHostelAmenitieDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getHostelAmenitieDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.hostelAmenitie_details)) {
        outputResponse = this.hostelAmenitieDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.hostelAmenitiesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostelAmenitie_details >>', err);
    }
    return outputResponse;
  }

  async getHostelAmenitieDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(HostelAmenitiesEntity)
        .createQueryBuilder('ha');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('ha.hostel_amenity_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.hostelAmenitie_details = this.blockResult.data;
    
    return inputParams;
  }

  hostelAmenitieDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('HostelAmenitie details found.'),
      fields: ['hostel_amenity_id', 'hostel_id', 'amenity_id'],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'hostelAmenitie_details',
      single_keys: ['hostelAmenitie_details'],
      output_keys: ['hostelAmenitie_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  hostelAmenitiesFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Hostel amenities not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'hostel_amenities' },
    );
  }
}
