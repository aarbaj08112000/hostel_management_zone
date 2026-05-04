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
import { AmenitiesEntity } from '../entities/amenities.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class AmenitiesService {
  protected readonly log = new LoggerHandler(
    AmenitiesService.name,
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

  async startAmenities(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getAmenities(this.inputParams);
      if (!_.isEmpty(this.inputParams.amenities)) {
        outputResponse = this.amenitiesFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.amenitiesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> amenities >>', err);
    }
    return outputResponse;
  }

  async getAmenities(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(AmenitiesEntity)
        .createQueryBuilder('a');

      if ('amenity_code' in inputParams) {
        query.where('a.amenity_code = :code', {
          code: inputParams.amenity_code,
        });
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

    inputParams.amenities = this.blockResult.data;
    
    return inputParams;
  }

  amenitiesFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Amenities found.'),
      fields: [
        'amenity_id',
        'amenity_name',
        'description',
        'amenity_code',
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
      name: 'amenities',
      multiple_keys: this.multipleKeys,
      output_keys: ['amenities'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startAmenitieDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getAmenitieDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.amenitie_details)) {
        outputResponse = this.amenitieDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.amenitiesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> amenitie_details >>', err);
    }
    return outputResponse;
  }

  async getAmenitieDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(AmenitiesEntity)
        .createQueryBuilder('a');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('a.amenity_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.amenitie_details = this.blockResult.data;
    
    return inputParams;
  }

  amenitieDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Amenitie details found.'),
      fields: [
        'amenity_id',
        'amenity_name',
        'description',
        'amenity_code',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'amenitie_details',
      single_keys: ['amenitie_details'],
      output_keys: ['amenitie_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  amenitiesFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Amenities not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'amenities' },
    );
  }
}
