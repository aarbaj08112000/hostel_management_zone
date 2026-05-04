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
import { VisitorLogsEntity } from '../entities/visitor_logs.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class VisitorLogsService {
  protected readonly log = new LoggerHandler(
    VisitorLogsService.name,
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

  async startVisitorLogs(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getVisitorLogs(this.inputParams);
      if (!_.isEmpty(this.inputParams.visitor_logs)) {
        outputResponse = this.visitorLogsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.visitorLogsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> visitor_logs >>', err);
    }
    return outputResponse;
  }

  async getVisitorLogs(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(VisitorLogsEntity)
        .createQueryBuilder('v');

      if ('student_id' in inputParams) {
        query.where('v.student_id = :sid', { sid: inputParams.student_id });
      }

      if ('visit_date' in inputParams) {
        query.andWhere('v.visit_date = :vdate', {
          vdate: inputParams.visit_date,
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

    inputParams.visitor_logs = this.blockResult.data;
    
    return inputParams;
  }

  visitorLogsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Visitor logs found.'),
      fields: [
        'visitor_id',
        'student_id',
        'visitor_name',
        'phone_number',
        'visit_date',
        'check_in_time',
        'check_out_time',
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
      name: 'visitor_logs',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['visitor_logs'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startVisitorLogDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getVisitorLogDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.visitorLog_details)) {
        outputResponse = this.visitorLogDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.visitorLogsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> visitorLog_details >>', err);
    }
    return outputResponse;
  }

  async getVisitorLogDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(VisitorLogsEntity)
        .createQueryBuilder('v');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('v.visitor_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.visitorLog_details = this.blockResult.data;
    
    return inputParams;
  }

  visitorLogDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('VisitorLog details found.'),
      fields: [
        'visitor_id',
        'student_id',
        'visitor_name',
        'phone_number',
        'visit_date',
        'check_in_time',
        'check_out_time',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'visitorLog_details',
      single_keys: ['visitorLog_details'],
      output_keys: ['visitorLog_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  visitorLogsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Visitor logs not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'visitor_logs' },
    );
  }
}
