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
import { DepositsEntity } from '../entities/deposits.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class DepositsService {
  protected readonly log = new LoggerHandler(
    DepositsService.name,
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

  async startDeposits(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getDeposits(this.inputParams);
      if (!_.isEmpty(this.inputParams.deposits)) {
        outputResponse = this.depositsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.depositsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> deposits >>', err);
    }
    return outputResponse;
  }

  async getDeposits(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(DepositsEntity)
        .createQueryBuilder('d');

      if ('stay_id' in inputParams) {
        query.where('d.stay_id = :sid', { sid: inputParams.stay_id });
      }

      if ('status' in inputParams) {
        query.andWhere('d.status = :status', { status: inputParams.status });
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

    inputParams.deposits = this.blockResult.data;
    
    return inputParams;
  }

  depositsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Deposits found.'),
      fields: [
        'deposit_id',
        'stay_id',
        'deposit_amount',
        'deposit_paid_date',
        'refund_amount',
        'refund_date',
        'status',
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
      name: 'deposits',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['deposits'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startDepositDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getDepositDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.deposit_details)) {
        outputResponse = this.depositDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.depositsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> deposit_details >>', err);
    }
    return outputResponse;
  }

  async getDepositDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(DepositsEntity)
        .createQueryBuilder('d');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('d.deposit_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.deposit_details = this.blockResult.data;
    
    return inputParams;
  }

  depositDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Deposit details found.'),
      fields: [
        'deposit_id',
        'stay_id',
        'deposit_amount',
        'deposit_paid_date',
        'refund_amount',
        'refund_date',
        'status',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'deposit_details',
      single_keys: ['deposit_details'],
      output_keys: ['deposit_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  depositsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Deposits not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'deposits' },
    );
  }
}
