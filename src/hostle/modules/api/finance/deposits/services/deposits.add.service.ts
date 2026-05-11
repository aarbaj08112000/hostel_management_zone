// src/services/deposits-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { DepositsEntity } from '../entities/deposits.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class DepositsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    DepositsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(DepositsEntity)
  protected depositRepo: Repository<DepositsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_deposit_data', 'update_deposit_data'];
    this.moduleName = 'deposit';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'deposit',
      table_name: 'deposits',
      table_alias: 'd',
      primary_key: 'deposit_id',
      primary_alias: 'd_deposit_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startDepositAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;
      inputParams = await this.insertDepositData(inputParams);
      if (!_.isEmpty(inputParams.insert_deposit_data))
        outputResponse = await this.depositFinishSuccess(
          inputParams,
          'Deposit Added Successfully.',
        );
      else outputResponse = await this.depositFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> deposit_add >>', err);
    }
    return outputResponse;
  }

  async insertDepositData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('stay_id' in inputParams) queryColumns.stay_id = inputParams.stay_id;
      if ('deposit_amount' in inputParams)
        queryColumns.deposit_amount = inputParams.deposit_amount;
      if ('deposit_paid_date' in inputParams)
        queryColumns.deposit_paid_date = inputParams.deposit_paid_date;
      if ('refund_amount' in inputParams)
        queryColumns.refund_amount = inputParams.refund_amount;
      if ('refund_date' in inputParams)
        queryColumns.refund_date = inputParams.refund_date;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.depositRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Deposit Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_deposit_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startDepositUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;
      inputParams = await this.updateDepositData(inputParams);
      if (!_.isEmpty(inputParams.update_deposit_data))
        outputResponse = await this.depositFinishSuccess(
          inputParams,
          'Deposit Updated Successfully.',
        );
      else outputResponse = await this.depositFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> deposit_update >>', err);
    }
    return outputResponse;
  }

  async updateDepositData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('deposit_amount' in inputParams)
        queryColumns.deposit_amount = inputParams.deposit_amount;
      if ('deposit_paid_date' in inputParams)
        queryColumns.deposit_paid_date = inputParams.deposit_paid_date;
      if ('refund_amount' in inputParams)
        queryColumns.refund_amount = inputParams.refund_amount;
      if ('refund_date' in inputParams)
        queryColumns.refund_date = inputParams.refund_date;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.depositRepo
        .createQueryBuilder()
        .update(DepositsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('deposit_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Deposit Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_deposit_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteDeposit(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteDepositData(id);
      if (inputParams.deleted_deposit)
        outputResponse = await this.depositFinishSuccess(
          inputParams,
          inputParams.message,
        );
      else outputResponse = await this.depositFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> deposit_delete >>', err);
    }
    return outputResponse;
  }

  async deleteDepositData(id: any) {
    try {
      const deleteResult = await this.depositRepo.delete({ deposit_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Deposit found.' };
      return {
        success: 1,
        message: 'Deposit Deleted Successfully.',
        deleted_deposit: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async depositFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_deposit_data'],
        },
        data: inputParams,
      },
      { name: 'deposit_add', single_keys: this.singleKeys },
    );
  }

  async depositFinishFailure(inputParams: any) {
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
      { name: 'deposit_add' },
    );
  }
}
