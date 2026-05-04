import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { VisitorLogsEntity } from '../entities/visitor_logs.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class VisitorLogsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    VisitorLogsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(VisitorLogsEntity)
  protected visitorRepo: Repository<VisitorLogsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_visitor_data', 'update_visitor_data'];
    this.moduleName = 'visitor_log';
    this.serviceConfig = {
      module_name: 'visitor_log',
      table_name: 'visitor_logs',
      table_alias: 'v',
      primary_key: 'visitorId',
      primary_alias: 'v_visitor_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startVisitorAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      let inputParams = await this.insertVisitorData(reqParams);
      return !_.isEmpty(inputParams.insert_visitor_data)
        ? await this.visitorFinishSuccess(
            inputParams,
            'Visitor Added Successfully.',
          )
        : await this.visitorFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> visitor_add >>', err);
      return {};
    }
  }

  async insertVisitorData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'visitor_name',
        'phone_number',
        'visit_date',
        'check_in_time',
        'check_out_time',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      const res = await this.visitorRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Visitor Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_visitor_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async visitorFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_visitor_data'],
        },
        data: inputParams,
      },
      { name: 'visitor_add', single_keys: this.singleKeys },
    );
  }
  async visitorFinishFailure(inputParams: any) {
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
      { name: 'visitor_add' },
    );
  }
}
