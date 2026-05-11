import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { PaymentAllocationsEntity } from '../entities/payment_allocations.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class PaymentAllocationsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    PaymentAllocationsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(PaymentAllocationsEntity)
  protected allocationRepo: Repository<PaymentAllocationsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_allocation_data', 'update_allocation_data'];
    this.moduleName = 'payment_allocation';
    this.serviceConfig = {
      module_name: 'payment_allocation',
      table_name: 'payment_allocations',
      table_alias: 'pa',
      primary_key: 'allocationId',
      primary_alias: 'pa_allocation_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startAllocationAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      let inputParams = await this.insertAllocationData(reqParams);
      return !_.isEmpty(inputParams.insert_allocation_data)
        ? await this.allocationFinishSuccess(
            inputParams,
            'Allocation Added Successfully.',
          )
        : await this.allocationFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> allocation_add >>', err);
      return {};
    }
  }

  async insertAllocationData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      ['payment_id', 'invoice_id', 'amount_allocated'].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.allocationRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Allocation Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_allocation_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async allocationFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_allocation_data'],
        },
        data: inputParams,
      },
      { name: 'allocation_add', single_keys: this.singleKeys },
    );
  }
  async allocationFinishFailure(inputParams: any) {
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
      { name: 'allocation_add' },
    );
  }
}
