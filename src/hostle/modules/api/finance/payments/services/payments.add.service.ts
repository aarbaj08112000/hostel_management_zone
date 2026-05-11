import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { PaymentsEntity } from '../entities/payments.entity';
import { BaseService } from '@repo/source/services/base.service';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class PaymentsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    PaymentsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;
  @InjectRepository(PaymentsEntity)
  protected paymentRepo: Repository<PaymentsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_payment_data', 'update_payment_data'];
    this.moduleName = 'payment';
    this.serviceConfig = {
      module_name: 'payment',
      table_name: 'payments',
      table_alias: 'p',
      primary_key: 'payment_id',
      primary_alias: 'p_payment_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startPaymentAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      let inputParams = await this.insertPaymentData(reqParams);
      if (inputParams.insert_payment_data.insert_id) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'payment';
          reqParams.entity_id = inputParams.insert_payment_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      return !_.isEmpty(inputParams.insert_payment_data)
        ? await this.paymentFinishSuccess(
          inputParams,
          'Payment Added Successfully.',
        )
        : await this.paymentFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> payment_add >>', err);
      return {};
    }
  }

  async startPaymentUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      let inputParams = await this.updatePaymentData(reqParams);
      if (!_.isEmpty(inputParams.update_payment_data)) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'payment';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      return !_.isEmpty(inputParams.update_payment_data)
        ? await this.paymentFinishSuccess(
          inputParams,
          'Payment Updated Successfully.',
        )
        : await this.paymentFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> payment_update >>', err);
      return {};
    }
  }

  async insertPaymentData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'reference_number',
        'status',
        'invoice_id',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';

      const res = await this.paymentRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Payment Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_payment_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async updatePaymentData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'reference_number',
        'status',
        'invoice_id',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.paymentRepo
        .createQueryBuilder()
        .update(PaymentsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('payment_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Payment Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_payment_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async paymentFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_payment_data', 'update_payment_data'],
        },
        data: inputParams,
      },
      { name: 'payment_add', single_keys: this.singleKeys },
    );
  }

  async paymentFinishFailure(inputParams: any) {
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
      { name: 'payment_add' },
    );
  }
}
