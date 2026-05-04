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
import { PaymentAllocationsEntity } from '../entities/payment_allocations.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class PaymentAllocationsService {
  protected readonly log = new LoggerHandler(
    PaymentAllocationsService.name,
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

  async startPaymentAllocations(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getPaymentAllocations(this.inputParams);
      if (!_.isEmpty(this.inputParams.payment_allocations)) {
        outputResponse = this.paymentAllocationsFinishedSuccess(
          this.inputParams,
        );
      } else {
        outputResponse = this.paymentAllocationsFinishedFailure(
          this.inputParams,
        );
      }
    } catch (err) {
      this.log.error('API Error >> payment_allocations >>', err);
    }
    return outputResponse;
  }

  async getPaymentAllocations(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(PaymentAllocationsEntity)
        .createQueryBuilder('pa');

      if ('payment_id' in inputParams) {
        query.where('pa.payment_id = :pid', { pid: inputParams.payment_id });
      }

      if ('invoice_id' in inputParams) {
        query.andWhere('pa.invoice_id = :iid', { iid: inputParams.invoice_id });
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

    inputParams.payment_allocations = this.blockResult.data;
    
    return inputParams;
  }

  paymentAllocationsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Payment allocations found.'),
      fields: ['allocation_id', 'payment_id', 'invoice_id', 'amount_allocated'],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'payment_allocations',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['payment_allocations'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startPaymentAllocationDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getPaymentAllocationDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.paymentAllocation_details)) {
        outputResponse = this.paymentAllocationDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.paymentAllocationsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> paymentAllocation_details >>', err);
    }
    return outputResponse;
  }

  async getPaymentAllocationDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(PaymentAllocationsEntity)
        .createQueryBuilder('pa');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('pa.allocation_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.paymentAllocation_details = this.blockResult.data;
    
    return inputParams;
  }

  paymentAllocationDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('PaymentAllocation details found.'),
      fields: ['allocation_id', 'payment_id', 'invoice_id', 'amount_allocated'],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'paymentAllocation_details',
      single_keys: ['paymentAllocation_details'],
      output_keys: ['paymentAllocation_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  paymentAllocationsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Payment allocations not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'payment_allocations' },
    );
  }
}
