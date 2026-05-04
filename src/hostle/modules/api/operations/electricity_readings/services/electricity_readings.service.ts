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
import { ElectricityReadingsEntity } from '../entities/electricity_readings.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class ElectricityReadingsService {
  protected readonly log = new LoggerHandler(
    ElectricityReadingsService.name,
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

  async startElectricityReadings(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getElectricityReadings(this.inputParams);
      if (!_.isEmpty(this.inputParams.electricity_readings)) {
        outputResponse = this.electricityReadingsFinishedSuccess(
          this.inputParams,
        );
      } else {
        outputResponse = this.electricityReadingsFinishedFailure(
          this.inputParams,
        );
      }
    } catch (err) {
      this.log.error('API Error >> electricity_readings >>', err);
    }
    return outputResponse;
  }

  async getElectricityReadings(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(ElectricityReadingsEntity)
        .createQueryBuilder('e');

      if ('room_id' in inputParams) {
        query.where('e.room_id = :room', { room: inputParams.room_id });
      }

      if ('reading_date' in inputParams) {
        query.andWhere('e.reading_date = :rdate', {
          rdate: inputParams.reading_date,
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

    inputParams.electricity_readings = this.blockResult.data;
    
    return inputParams;
  }

  electricityReadingsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Electricity readings found.'),
      fields: [
        'reading_id',
        'room_id',
        'reading_date',
        'units_consumed',
        'rate_per_unit',
        'total_amount',
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
      name: 'electricity_readings',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['electricity_readings'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startElectricityReadingDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getElectricityReadingDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.electricityReading_details)) {
        outputResponse = this.electricityReadingDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.electricityReadingsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> electricityReading_details >>', err);
    }
    return outputResponse;
  }

  async getElectricityReadingDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(ElectricityReadingsEntity)
        .createQueryBuilder('e');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('e.reading_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.electricityReading_details = this.blockResult.data;
    
    return inputParams;
  }

  electricityReadingDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('ElectricityReading details found.'),
      fields: [
        'reading_id',
        'room_id',
        'reading_date',
        'units_consumed',
        'rate_per_unit',
        'total_amount',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'electricityReading_details',
      single_keys: ['electricityReading_details'],
      output_keys: ['electricityReading_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  electricityReadingsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Electricity readings not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'electricity_readings' },
    );
  }
}
